import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from './entities/board.entity';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AuthService } from 'src/auth/auth.service';
import { UserBoardEntity } from './entities/user-board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BoardEntity, UserBoardEntity])],
  controllers: [BoardController],
  providers: [BoardService, CloudinaryService, AuthService],
  exports: [TypeOrmModule.forFeature([BoardEntity, UserBoardEntity])],
})
export class BoardModule {}
