import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/entities/user.entity';
import { BoardEntity } from './board/entities/board.entity';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InviteModule } from './invite/invite.module';
import { UserBoardEntity } from './board/entities/user-board.entity';
import { InviteEntity } from './invite/entities/invite.entity';
import { CartModule } from './cart/cart.module';
import { BoardFlowEntity } from './board/entities/board-flow.entity';
import { LabelEntity } from './cart/entities/label.entity';
import { UserTimeTrackerEntity } from './cart/entities/user-time-tracker.entity';
import { CartEntity } from './cart/entities/cart.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        UserEntity,
        BoardEntity,
        UserBoardEntity,
        InviteEntity,
        BoardFlowEntity,
        CartEntity,
        LabelEntity,
        UserTimeTrackerEntity,
      ],
      synchronize: true,
    }),
    UserModule,
    BoardModule,
    AuthModule,
    InviteModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
