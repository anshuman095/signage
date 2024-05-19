import { Response } from 'express';
import {
  Controller,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { ConfrimInvitationDto } from './dto/confirm-invite.dto';
import { EmailService } from 'src/utility/email.service';

interface CustomRequest extends Request {
  user: { id: number; email: string };
}
@Controller('invitation')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  // @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard)
  @Post()
  async createInvitation(
    @Req() req: CustomRequest,
    @Body() createInviteDto: CreateInviteDto,
    @Query('userId') userId: number,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    try {
      // const {id} = req.user;
      if (userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (user) {
          const data = await this.inviteService.sendInvitation(
            createInviteDto,
            user,
          );
          return res.status(201).json({
            success: true,
            message: 'Invitation sent successfully!',
            invite: data,
          });
        } else {
          throw new Error('User does not exist');
        }
      } else {
        const user = await this.userRepository.findOneBy({ email: email });
        if (user) {
          throw new Error('User already registered');
        }

        const message = await this.inviteService.sendInvitation(
          createInviteDto,
          email,
        );
        // const registrationLink = process.env.REGESTRATION_URL;

        // const emailData = {
        //   subject: "Registration Link",
        //   html: `Please click the following link to register your email: ${email} <a href="${registrationLink}" style="color: blue">Register here</a>. `,
        // };

        // await this.emailService.sendEmail(email, emailData);
        return res.status(200).json({
          success: true,
          message: message,
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

      await this.inviteService.confirmInvitation(
        inviteId,
        user_id,
        user_email,
        board_id,
      );

      return res.status(200).json({
        success: true,
        message: 'Invitation confirmed successfully!',
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}
