import { IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsNotEmpty()
  cart_title: string;

  cart_description: string;

  board_id: number;

  label_name: string;

  color_code: string;

  attachment_url: string[];

  user_id: number;

  checklist_title: string;

  checklist_status: boolean;
}
