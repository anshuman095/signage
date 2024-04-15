// import { IsNotEmpty, IsString } from 'class-validator';

import { BoardEntity } from 'src/board/entities/board.entity';

export enum Status {
  PENDING = 'PENDING',
  CONFIRM = 'CONFIRM',
}

export class CreateInviteDto {
  board_id: BoardEntity;

  board: number;

  user: number;

  user_email: string;

  status: Status;

  is_active: boolean;

  expiry_time: Date;
}
