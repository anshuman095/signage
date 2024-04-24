import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty()
  @IsString()
  label_name: string;

  @IsNotEmpty()
  @IsString()
  color_code: string;
}
