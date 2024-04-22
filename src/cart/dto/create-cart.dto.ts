import { IsNotEmpty } from 'class-validator';
import { BoardEntity } from 'src/board/entities/board.entity';

export class CreateCartDto {
  @IsNotEmpty()
  cart_title: string;

  cart_description: string;

  board_id: BoardEntity;
}
