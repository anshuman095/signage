import * as jwt from 'jsonwebtoken';
import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  Req,
  Res,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateLoginDto } from './dto/create-login.dto';
import { EmailService } from 'src/utility/email.service';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';

interface CustomRequest extends Request {
  user: { id: number; email: string };
}
@Controller('/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @Post('create')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: CreateUserDto,
  })
  @ApiBadRequestResponse({
    description: 'User creation failed',
    type: CreateUserDto,
  })
  async create(
    @Body(new ValidationPipe()) createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    try {
      if (createUserDto.password !== createUserDto.confirm_password) {
        throw new Error('Password and confirm password does not match');
      }
      const addedUser = await this.userService.createUser(createUserDto);
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        result: addedUser,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const email = decodedToken.email;
      const user = await this.userService.UserRepository.findOne({
        where: { email: email },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await this.userService.UserRepository.save(user);
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }
  }

  @Post('/signin')
  async loginUser(
    @Body() createLogionDto: CreateLoginDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.login(createLogionDto);
      return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        result: result,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.UserRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (user) {
        const resetToken = await this.userService.generateResetToken(
          createUserDto.email,
        );

        const resetUrl = process.env.RESET_URL;
        const emailData = {
          subject: 'Password Reset',
          html: `<p>Click the following link to reset your password:</p>
          <a href="${resetUrl}/${resetToken}" style="color: blue">Reset Password</a>`,
        };
        await this.emailService.sendEmail(createUserDto.email, emailData);

        return res.status(200).json({
          success: true,
          message: 'Password reset link sent to email',
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  }

  @Post('/reset-password/:token')
  async reset(
    @Param('token') token: string,
    @Body() createUserDto: { password: string; confirm_password: string },
    @Res() res: Response,
  ) {
    try {
      if (createUserDto.password !== createUserDto.confirm_password) {
        throw new BadRequestException(
          'Password and confrim password do not match',
        );
      }

      const { email } = this.userService.verifyResetToken(token);
      this.userService.verifyResetToken(token);

      await this.userService.resetPassword(email, createUserDto.password);

      return res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Get('/search')
  async searchUserByEmail(
    @Req() req: CustomRequest,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      if (!email || email.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Email query must be at least 3 characters long',
        });
      }

      const users = await this.userService.searchUsersByEmail(email, id);

      if (users.length === 0) {
        return res.status(200).json({
          success: true,
          message: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: users,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Get('/getUserDetails')
  @UseGuards(AuthenticationGuard)
  async getUserDetails(@Req() req: CustomRequest, @Res() res: Response) {
    try {
      const { id } = req.user;
      const user = await this.userService.getDetailsOfLoginUser(id);
      return res.status(200).json({
        success: true,
        message: user,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}
