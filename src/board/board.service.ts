import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardEntity } from './entities/board.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto) {
    const board = await this.boardRepository.findOne({
      where: { boardName: createBoardDto.boardName },
    });
    if (!board) {
      const createdBoard = this.boardRepository.create(createBoardDto);
      const boardData = await this.boardRepository.save(createdBoard);
      return boardData;
    } else {
      throw new Error('Board name already exist with this name');
    }
  }

  findAll() {
    return `This action returns all board`;
  }

  findOne(id: number) {
    return `This action returns a #${id} board`;
  }

  async updateBoard(id: number, updateBoardDto: UpdateBoardDto) {
    try {
      const existingBoard = await this.boardRepository.findOneBy({ id });
      if (!existingBoard) {
        throw new Error('Board not found');
      }
      Object.assign(existingBoard, updateBoardDto);
      const boardData = await this.boardRepository.save(existingBoard);
      return boardData;
    } catch (err) {
      throw new Error(`Failed to update board: ${err}`);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} board`;
  }
}
