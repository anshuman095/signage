import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, UserEntity } from './entities/user.entity';
import { CreateLoginDto } from './dto/create-login.dto';
import { EmailService } from 'src/utility/email.service';
import { InviteEntity, Status } from 'src/invite/entities/invite.entity';
import { UserBoardEntity } from 'src/board/entities/user-board.entity';
import { BoardEntity } from 'src/board/entities/board.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    private readonly emailService: EmailService,

    @InjectRepository(InviteEntity)
    private inviteRepository: Repository<InviteEntity>,

    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,

    @InjectRepository(UserBoardEntity)
    private userBoardRepository: Repository<UserBoardEntity>,
  ) {}

  get UserRepository(): Repository<UserEntity> {
    return this.userRepository;
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new Error('User already exist with this email');
    } else {
      const createdUser = this.userRepository.create(createUserDto);
      const payload = {
        email: createUserDto.email,
        role: createUserDto.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
      });

      createdUser.emailVerificationToken = token;

      const userData = await this.userRepository.save(createdUser);

      const verificationLink = `${process.env.VERIFICATION_URL}`;

      const emailData = {
        subject: 'Email Verification',
        html: `Please click the following link to verify your email: ${createUserDto.email} <a href="${verificationLink}?token=${token}" style="color: blue">Verification Link
        </a>`,
      };
      await this.emailService.sendEmail(createUserDto.email, emailData);
      delete userData.password;

      const invite = await this.inviteRepository.findOne({
        where: { user_email: userData.email },
        relations: ['user_id', 'board_id'],
      });
      console.log('invite', invite);

      if (invite) {
        await this.inviteRepository.update(invite.id, {
          status: Status.CONFIRM,
          user_id: { id: userData.id },
        });
        const board = await this.boardRepository.findOne({
          where: { id: invite?.board_id?.id },
          relations: ['users'],
        });
        if (!board) {
          throw new Error('Board not found');
        }
        board.users = [...board?.users, userData];
        await this.boardRepository.save(board);
        const user_board = this.userBoardRepository.create({
          is_active: true,
          status: 'active',
          board_id: invite.board_id,
          user_id: userData,
        });
        await this.userBoardRepository.save(user_board);
      }

      return userData;
    }
  }

  async login(createLogionDto: CreateLoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: createLogionDto.email })
      .getOne();
    // if(user.isEmailVerified === false) {
    //   throw new Error("Email is not verified")
    // }

    if (user) {
      const { password } = user;

      const checkPassword = await bcrypt.compare(
        createLogionDto.password,
        password,
      );

      if (checkPassword) {
        const payload = {
          id: user.id,
          email: createLogionDto.email,
          role: user.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
        delete user.password;
        return { token, user };
      } else {
        throw new Error('Incorrect password');
      }
    } else {
      throw new Error('Incorrect email');
    }
  }

  generateResetToken(email: string): string {
    const payload = { email };
    return jwt.sign(payload, process.env.RESET_SECRET_KEY, { expiresIn: '5m' });
  }

  verifyResetToken(token: string): { email: string } {
    return jwt.verify(token, process.env.RESET_SECRET_KEY) as { email: string };
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;

      await this.userRepository.save(user);
    } else {
      throw new Error('User not found');
    }
  }

  async searchUsersByEmail(email: string, userId: number) {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email LIKE :email', { email: `%${email}%` })
        .andWhere('user.role != :role', { role: Role.SUPERADMIN })
        .andWhere('user.id != :userId', { userId: userId })
        .getMany();
      return users;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDetailsOfLoginUser(user_id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
