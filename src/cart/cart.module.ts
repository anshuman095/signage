import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartEntity } from './entities/cart.entity';
import { UserModule } from 'src/user/user.module';
import { BoardModule } from 'src/board/board.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { LabelEntity } from './entities/label.entity';
import { UserTimeTrackerEntity } from './entities/user-time-tracker.entity';
import { AuthService } from 'src/auth/auth.service';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity, LabelEntity, UserTimeTrackerEntity]),
    UserModule,
    BoardModule,
  ],
  controllers: [CartController],
  providers: [CartService, AuthService, CloudinaryService],
})
export class CartModule {}
