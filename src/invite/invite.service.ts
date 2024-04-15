import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
// import { UpdateInviteDto } from './dto/update-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteEntity, Status } from './entities/invite.entity';
import { EmailService } from 'src/utility/email.service';
import { UserBoardEntity } from 'src/board/entities/user-board.entity';
import { BoardEntity } from 'src/board/entities/board.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteEntity)
    private inviteRepository: Repository<InviteEntity>,
    @InjectRepository(UserBoardEntity)
    private userBoardRepository: Repository<UserBoardEntity>,
    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,
    private readonly emailService: EmailService,
  ) {}

  async create(createInviteDto: CreateInviteDto, user, userId) {
    const user_board = await this.userBoardRepository.findOne({
      where: { user: userId, board: createInviteDto.board },
    });
    const board = await this.boardRepository.findOneBy({
      id: createInviteDto.board,
    });
    console.log('board->', board);

    if (!user_board) {
      const invite = await this.inviteRepository.findOne({
        where: {
          user_email: user.email,
          user: userId,
          status: Status.PENDING,
          is_active: true,
        },
      });
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 2);
      const invitationLink = `${process.env.INVITATION_URL}`;
      const emailData = {
        subject: 'Invitation',
        html: `Please click the following link to accept the invitation <a
         "href="${invitationLink}">${invitationLink}</a> and this invitation link will expire on ${expiryTime}`,
      };
      if (invite) {
        await this.emailService.sendEmail(user.email, emailData);
        return;
      } else {
        const created_invite = this.inviteRepository.create({
          board_id: board,
          user_id: userId,
          board: createInviteDto.board,
          user: userId,
          user_email: user.email,
          status: Status.PENDING,
          is_active: true,
          expiry_time: expiryTime,
        });
        const invite = await this.inviteRepository.save(created_invite);
        await this.emailService.sendEmail(user.email, emailData);
        return invite;
      }
    } else {
      throw new Error('User already exist in board');
    }
  }

  findAll() {
    return `This action returns all invite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invite`;
  }

  // update(id: number, updateInviteDto: UpdateInviteDto) {
  //   return `This action updates a #${id} invite`;
  // }

  remove(id: number) {
    return `This action removes a #${id} invite`;
  }
}
