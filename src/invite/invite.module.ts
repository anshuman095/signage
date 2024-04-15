import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { BoardModule } from 'src/board/board.module';
import { InviteEntity } from './entities/invite.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/utility/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([InviteEntity]), UserModule, BoardModule],
  controllers: [InviteController],
  providers: [InviteService, AuthService, EmailService],
})
export class InviteModule {}
