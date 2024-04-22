import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BoardEntity } from './entities/board.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserBoardEntity } from './entities/user-board.entity';
import { BoardFlowEntity } from './entities/board-flow.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,

    @InjectRepository(UserBoardEntity)
    private userBoardRepository: Repository<UserBoardEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(BoardFlowEntity)
    private boardFlowRepository: Repository<BoardFlowEntity>,
  ) {}

  async createBoard(
    createBoardDto: CreateBoardDto,
    user_id: number,
  ): Promise<BoardEntity> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      const board = await this.boardRepository.findOne({
        where: { boardName: createBoardDto.boardName },
      });

      if (!board) {
        const createdBoard = this.boardRepository.create({
          ...createBoardDto,
          createdBy: user,
        });
        const boardData = await this.boardRepository.save(createdBoard);
        return boardData;
      } else {
        throw new Error('Board name already exist with this name');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getFlowOfABoard(boardId: number) {
    try {
      const boardFlow = await this.boardRepository.find({
        where: { id: boardId },
        relations: ['users', 'flows', 'createdBy'],
      });
      return boardFlow;
    } catch (error) {
      return error.message;
    }
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

  async getAllBoards() {
    try {
      const boards = await this.boardRepository.find({
        relations: ['users', 'flows', 'createdBy'],
      });
      return boards;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getMyBoards(userId: number) {
    try {
      const board = await this.boardRepository.find({
        where: { createdBy: { id: userId } },
        relations: ['users', 'flows', 'createdBy'],
      });
      return board;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBoardsById(boardId: number) {
    try {
      const board = await this.boardRepository.find({
        where: { id: boardId },
        relations: ['users', 'flows', 'createdBy'],
      });
      return board;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBoardIdOfUserId(boardId: number, userId: number) {
    try {
      const board = await this.boardRepository.find({
        where: { id: boardId, createdBy: { id: userId } },
        relations: ['users', 'flows', 'createdBy'],
      });
      return board;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteBoard(id: number) {
    try {
      await this.boardRepository.delete(id);
    } catch (error) {
      return error.message;
    }
  }

  async getUsersInBoard(boardId): Promise<UserEntity[]> {
    try {
      const userBoards = await this.userBoardRepository.find({
        where: { board_id: { id: boardId } },
        relations: ['user_id'],
      });

      const userIds = userBoards.map((userBoard) => userBoard.user_id.id);
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
      });
      return users;
    } catch (error) {
      return error.message;
    }
  }

  async removeUserFromBoard(boardId: number, userId: number): Promise<void> {
    try {
      const userBoard = await this.userBoardRepository.findOne({
        where: { board_id: { id: boardId }, user_id: { id: userId } },
      });

      if (!userBoard) {
        throw new Error('User not found in the board');
      }
      await this.userBoardRepository.remove(userBoard);
    } catch (error) {
      throw new Error('Failed to remove user from the board: ' + error.message);
    }
  }

  async createBoardFlow(createBoardFlowDto) {
    try {
      const { boardId } = createBoardFlowDto;
      const boardFlowDetails = await this.boardFlowRepository.find({
        where: { board_id: { id: boardId } },
      });
      for (const flow of boardFlowDetails) {
        if (flow.flow_name === createBoardFlowDto.flow_name) {
          throw new Error('Flow name is already taken.');
        }

        if (flow.index === createBoardFlowDto.index.toString()) {
          throw new Error('Index is already taken.');
        }
      }
      const newBoardFlow = this.boardFlowRepository.create({
        ...createBoardFlowDto,
        board_id: boardId,
      }) as unknown as BoardFlowEntity;
      const boardFlow = await this.boardFlowRepository.save(newBoardFlow);

      const board = await this.boardRepository.findOne({
        where: { id: boardId },
        relations: ['flows'],
      });

      board.flows = [...board.flows, boardFlow];
      await this.boardRepository.save(board);

      return boardFlow;
    } catch (error) {
      return error.message;
    }
  }

  // async getFlowOfABoard(boardId: number) {
  //   try {
  //     const boardFlow = await this.boardRepository.find({
  //       where: { id: boardId },
  //       relations: ["flows"],
  //     });
  //     return boardFlow;
  //   } catch (error) {
  //     return error.message;
  //   }
  // }
}
