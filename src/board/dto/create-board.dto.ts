import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  boardName: string;

  logo: string;

  description: string;

  userId: number | string;

  user_email: string;
}
