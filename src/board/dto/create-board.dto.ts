import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  boardName: string;

  logo: string;

  description: string;

  userId: number;

  user_email: string;
}
