import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteEntity, Status } from './entities/invite.entity';
import { EmailService } from 'src/utility/email.service';
import { UserBoardEntity } from 'src/board/entities/user-board.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteEntity)
    private inviteRepository: Repository<InviteEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(UserBoardEntity)
    private userBoardRepository: Repository<UserBoardEntity>,

    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,

    private readonly emailService: EmailService,
  ) {}

  async sendInvitation(createInviteDto: CreateInviteDto, user) {
    const user_board = await this.userBoardRepository
      .createQueryBuilder('user_board')
      .where('user_board.user_id = :userId', { userId: user?.id })
      .andWhere('user_board.board_id = :boardId', {
        boardId: createInviteDto.board_id,
      })
      .getOne();
    console.log('user_board', user_board);

    const board = await this.boardRepository.findOneBy({
      id: createInviteDto.board_id,
    });
    if (!user_board) {
      const currentTime = new Date();
      const invite = await this.inviteRepository
        .createQueryBuilder('invite')
        .where('invite.user_email = :email', { email: user.email })
        .andWhere('invite.user_id = :userId', { userId: user?.id })
        .andWhere('invite.status = :status', { status: Status.PENDING })
        .andWhere('invite.is_active = :isActive', { isActive: true })
        .getOne();
      console.log('invite--->', invite);

      const invitationLink = `${process.env.INVITATION_URL}`;
      console.log('process.env.INVITATION_URL', process.env.INVITATION_URL);

      if (!invite) {
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1);

        console.log('user-->', user);
        const created_invite = this.inviteRepository.create({
          board_id: board,
          user_id: user.id,
          user_email: user.email ? user.email : user,
          status: Status.PENDING,
          is_active: true,
          expiry_time: expiryTime,
        });

        const newInvite = await this.inviteRepository.save(created_invite);
        const emailData = {
          subject: 'Invitation',
          html: `Please click the following link to accept the invitation <a href="${invitationLink}?inviteId=${newInvite.id}&user_id=${user.id}
          &user_email=${user.email}&board=${createInviteDto.board_id}">${invitationLink}</a> and this invitation link will expire on ${expiryTime}`,
        };
        console.log('emailData-->', emailData);
        await this.emailService.sendEmail(user.email || user, emailData);
        newInvite.invitation_url = emailData.html;
        await this.inviteRepository.save(newInvite);
        return newInvite;
      } else if (invite.expiry_time < currentTime) {
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 1);
        const created_invite = this.inviteRepository.create({
          board_id: board,
          user_id: user.id,
          user_email: user.email ? user.email : user,
          status: Status.PENDING,
          is_active: true,
          expiry_time: expiryTime,
        });

        const newInvite = await this.inviteRepository.save(created_invite);
        const emailData = {
          subject: 'Invitation',
          html: `Please click the following link to accept the invitation <a href="${invitationLink}?inviteId=${newInvite.id}&user_id=${user.id}
          &user_email=${user.email}&board=${createInviteDto.board_id}">${invitationLink}</a> and this invitation link will expire on ${expiryTime}`,
        };
        await this.emailService.sendEmail(user.email, emailData);
        newInvite.invitation_url = emailData.html;
        await this.inviteRepository.save(newInvite);
        return newInvite;
      } else {
        if (currentTime < invite.expiry_time) {
          const emailData = {
            subject: 'Invitation',
            html: invite.invitation_url,
          };
          await this.emailService.sendEmail(user.email || user, emailData);
          return invite;
        }
      }
    } else {
      throw new Error('User already exist in board');
    }
  }

  async confirmInvitation(
    inviteId: number,
    user_id: number,
    user_email: string,
    board_id: number,
  ): Promise<InviteEntity> {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new Error('Invitation not found');
    }
    if (invite.user_email !== user_email) {
      throw new Error('Invalid email');
    }

    invite.status = Status.CONFIRM;

    const confirm_invite = this.inviteRepository.create(invite);
    const confirm_new_invite = await this.inviteRepository.save(confirm_invite);

    const board = await this.boardRepository.findOne({
      where: { id: board_id },
    });
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    const user_board = this.userBoardRepository.create({
      is_active: true,
      status: 'active',
      board_id: board,
      user_id: user,
    });
    await this.userBoardRepository.save(user_board);

    return confirm_new_invite;
  }
}
