import { Response } from 'express';
import { Controller, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AuthorizationGuard } from 'src/auth/authorization.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { ConfrimInvitationDto } from './dto/confirm-invite.dto';
import { EmailService } from 'src/utility/email.service';

@Controller('invitation')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Post()
  async create(
    @Body() createInviteDto: CreateInviteDto,
    @Query('userId') userId: number,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    try {
      if (userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (user) {
          await this.inviteService.sendInvitation(
            createInviteDto,
            user,
            // userId,
          );
          return res.status(201).json({
            success: true,
            message: 'Invitation sent successfully!',
          });
        } else {
          throw new Error('User does not exist');
        }
      } else {
        console.log('email-->', email);

        await this.inviteService.sendInvitation(createInviteDto, email);
        const registrationLink = process.env.REGESTRATION_URL;

        const emailData = {
          subject: 'Registration Link',
          html: `Please click the following link to register your email: ${email} <a href="${registrationLink}">${registrationLink}</a> `,
        };
        console.log('email--->', email);

        await this.emailService.sendEmail(email, emailData);
        return res.status(200).json({
          success: true,
          message: 'Regestration Link Send Successfully!',
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Post('/confirm')
  async confirmInvitation(
    @Body() confirmInviteDto: ConfrimInvitationDto,
    @Res() res: Response,
  ) {
    try {
      const { inviteId, user_id, user_email, board_id } = confirmInviteDto;

      const confirmedInvite = await this.inviteService.confirmInvitation(
        inviteId,
        user_id,
        user_email,
        board_id,
      );

      return res.status(200).json({
        success: true,
        message: 'Invitation confirmed successfully!',
        data: confirmedInvite,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}
