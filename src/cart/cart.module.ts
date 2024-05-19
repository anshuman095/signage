import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartEntity } from './entities/cart.entity';
import { LabelEntity } from './entities/label.entity';
import { CartChecklistEntity } from './entities/cart-checklist.entity';
import { UserTimeTrackerEntity } from './entities/user-time-tracker.entity';
import { CommentEntity } from './entities/comment.entity';
import { CartController } from './cart.controller';
import { UserModule } from 'src/user/user.module';
import { BoardModule } from 'src/board/board.module';
import { CartService } from './cart.service';
import { AuthService } from 'src/auth/auth.service';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { SocketService } from 'src/socket/socket.gateway';
import { AttachmentEntity } from './entities/attachment.entity';
import { EmailService } from 'src/utility/email.service';
import { CartHistoryEntity } from './entities/cart-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CartEntity,
      LabelEntity,
      CartChecklistEntity,
      UserTimeTrackerEntity,
      CommentEntity,
      AttachmentEntity,
      CartHistoryEntity,
    ]),
    UserModule,
    BoardModule,
  ],
  controllers: [CartController],
  providers: [
    CartService,
    AuthService,
    CloudinaryService,
    SocketService,
    EmailService,
  ],
})
export class CartModule {}
