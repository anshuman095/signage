export enum Status {
  PENDING = 'PENDING',
  CONFIRM = 'CONFIRM',
}

export class CreateInviteDto {
  board_id: number;

  user_email: string;

  status: Status;

  is_active: boolean;

  expiry_time: Date;
}
