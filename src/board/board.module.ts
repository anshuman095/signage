import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from './entities/board.entity';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AuthService } from 'src/auth/auth.service';
import { UserBoardEntity } from './entities/user-board.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { BoardFlowEntity } from './entities/board-flow.entity';
import { InviteEntity } from 'src/invite/entities/invite.entity';
import { InviteService } from 'src/invite/invite.service';
import { EmailService } from 'src/utility/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      UserBoardEntity,
      UserEntity,
      BoardFlowEntity,
      InviteEntity,
    ]),
  ],
  controllers: [BoardController],
  providers: [
    BoardService,
    CloudinaryService,
    AuthService,
    InviteService,
    EmailService,
  ],
  exports: [TypeOrmModule.forFeature([BoardEntity, UserBoardEntity])],
})
export class BoardModule {}
