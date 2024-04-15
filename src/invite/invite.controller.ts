import { Response } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
// import { UpdateInviteDto } from './dto/update-invite.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AuthorizationGuard } from 'src/auth/authorization.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { UserBoardEntity } from 'src/board/entities/user-board.entity';

@Controller('invitation')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(UserEntity)
    private readonly userBoardRepository: Repository<UserBoardEntity>,
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
          await this.inviteService.create(createInviteDto, user, userId);
          return res.status(201).json({
            success: true,
            message: 'Invitation sent successfully!',
          });
        } else {
          throw new Error('User does not exist');
        }
      } else {
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Post('/confirm')
  async confrimInvitation() {}

  @Get()
  findAll() {
    return this.inviteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inviteService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateInviteDto: UpdateInviteDto) {
  //   return this.inviteService.update(+id, updateInviteDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inviteService.remove(+id);
  }
}
