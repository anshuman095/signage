import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/utility/email.service';
import { InviteEntity } from 'src/invite/entities/invite.entity';
import { UserBoardEntity } from 'src/board/entities/user-board.entity';
import { BoardEntity } from 'src/board/entities/board.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      InviteEntity,
      BoardEntity,
      UserBoardEntity,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, EmailService],
  exports: [UserService, TypeOrmModule.forFeature([UserEntity])],
})
export class UserModule {}
