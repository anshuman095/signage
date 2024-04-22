import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { CreateLoginDto } from './dto/create-login.dto';
import { EmailService } from 'src/utility/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
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
        html: `Please click the following link to verify your email: ${createUserDto.email} <a href="${verificationLink}?token=${token}">${verificationLink}
        </a>`,
      };
      await this.emailService.sendEmail(createUserDto.email, emailData);
      delete userData.password;
      return userData;
    }
  }

  async login(createLogionDto: CreateLoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: createLogionDto.email },
    });
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
        throw new Error('Incorrect email or password');
      }
    } else {
      throw new Error('User not found');
    }
  }

  async searchUsersByEmail(email: string) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email LIKE :email', { email: `%${email}%` })
      .getMany();
    return users;
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
