import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BoardEntity } from './entities/board.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserBoardEntity } from './entities/user-board.entity';
import { BoardFlowEntity } from './entities/board-flow.entity';
import { AddMemberInBoardflowDto } from './dto/add-member-boardflow.dto';
import { InviteService } from 'src/invite/invite.service';
import { InviteEntity, Status } from 'src/invite/entities/invite.entity';
import { UpdateBoardFlowDto } from './dto/update-board-flow.dto';

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

    @InjectRepository(InviteEntity)
    private inviteRepository: Repository<InviteEntity>,

    private readonly inviteService: InviteService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto, user_id: number) {
    try {
      const { userId } = createBoardDto;
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

        let convertedUserId: string | number;

        if (
          typeof userId === 'string' &&
          (userId.includes('@') || userId.includes('.'))
        ) {
          convertedUserId = userId;
        } else {
          convertedUserId = Number(userId);
        }

        if (convertedUserId) {
          let query = this.userRepository.createQueryBuilder('user');

          if (typeof convertedUserId === 'number') {
            query = query.where('user.id = :userId', {
              userId: convertedUserId,
            });
          } else if (typeof convertedUserId === 'string') {
            query = query.where('user.email = :email', {
              email: convertedUserId,
            });
          }

          const userToSendInvitationExist = await query.getOne();

          const createInviteDto = {
            board_id: boardData.id,
          };
          // eslint-disable-next-line no-var
          var invite = await this.inviteService.sendInvitation(
            createInviteDto,
            userToSendInvitationExist || userId,
          );
        }
        const defaultFlows = [
          { flow_name: 'To Do', index: 1 },
          { flow_name: 'In Progress', index: 2 },
          { flow_name: 'Testing', index: 3 },
          { flow_name: 'Done', index: 4 },
        ];
        for (const flow of defaultFlows) {
          const createBoardFlowDto = {
            flow_name: flow.flow_name,
            index: flow.index,
            boardId: boardData.id,
          };
          await this.createBoardFlow(createBoardFlowDto);
        }
        return { boardData, invite };
      } else {
        throw new Error('Board name already exist with this name');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getFlowOfABoardByBoardId(boardId: number) {
    try {
      const boardFlow = await this.boardRepository.find({
        where: { id: boardId },
        relations: ['flows', 'flows.users'],
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

  async getAllBoards(id: number) {
    try {
      const user = await this.userRepository.find({
        where: { id: id },
      });
      if (!user) {
        throw new Error('User does not exist');
      }

      const boards = await this.boardRepository
        .createQueryBuilder('board')
        .leftJoinAndSelect('board.users', 'user')
        .leftJoinAndSelect('board.flows', 'flow')
        .leftJoinAndSelect('board.createdBy', 'creator')
        .where('board.createdBy = :userId', { userId: id })
        .orWhere('user.id = :userId', { userId: id })
        .orderBy('board.created_at', 'DESC')
        .getMany();

      if (!boards) {
        throw new Error('No boards found');
      }

      return boards;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getMyBoards(userId: number, paginationOptions: any) {
    try {
      const { page, limit } = paginationOptions;
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User does not exist');
      }
      const conditions = { createdBy: { id: userId } };
      const [board, total] = await this.boardRepository.findAndCount({
        where: conditions,
        take: limit,
        skip: (page - 1) * limit,
        order: { created_at: 'DESC' },
        relations: ['users', 'flows', 'createdBy'],
      });
      if (!board) {
        throw new Error('No boards found');
      }
      const totalPages = Math.ceil(total / limit);
      const currentPage = page;
      return { board, total, currentPage, totalPages };
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

  async getUsersInBoard(boardId: number) {
    try {
      // const userBoards = await this.userBoardRepository.find({
      //   where: { board_id: { id: boardId } },
      //   relations: ["user_id"],
      // });

      const invitedUser = await this.inviteRepository.find({
        where: {
          board_id: { id: boardId },
          status: In([Status.PENDING, Status.CONFIRM]),
        },
        relations: ['user_id'],
        select: ['user_id', 'status', 'user_email'],
      });

      // const userIds = invitedUser.map((userInvite) => userInvite.user_id.id);
      // const users = await this.userRepository.find({
      //   where: { id: In(userIds) },
      // });
      return invitedUser;
    } catch (error) {
      return error.message;
    }
  }

  async removeUserFromBoard(boardId: number, userEmail: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: userEmail },
      });
      if (user) {
        // eslint-disable-next-line no-var
        var userBoard = await this.userBoardRepository.findOne({
          where: { board_id: { id: boardId }, user_id: { id: user.id } },
        });
      }

      const invite = await this.inviteRepository.findOne({
        where: {
          user_email: userEmail,
          board_id: { id: boardId },
          status: In([Status.PENDING, Status.CONFIRM]),
        },
      });

      if (userBoard) {
        await this.userBoardRepository.remove(userBoard);
      }

      await this.inviteRepository.remove(invite);
      const board = await this.boardRepository.findOne({
        where: { id: boardId },
        relations: ['users'],
      });
      console.log(board.users);
      board.users = board?.users.filter((u) => u?.id !== user?.id);
      await this.boardRepository.save(board);
    } catch (error) {
      throw new Error(error.message);
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

  async addMembersInBoardFlow(
    addMemberInBoardflowDto: AddMemberInBoardflowDto,
  ) {
    try {
      const { user_id, board_id, flow_id } = addMemberInBoardflowDto;
      const board = await this.boardRepository.findOne({
        where: { id: board_id },
        relations: ['flows', 'users'],
      });
      let userExist = false;
      board.users.forEach((user) => {
        if (user.id === user_id) {
          userExist = true;
        }
      });
      if (!userExist) {
        throw new Error('User does not exist in board');
      }
      let flowExist = false;
      board.flows.forEach((flow) => {
        if (flow.id === flow_id) {
          flowExist = true;
        }
      });
      if (!flowExist) {
        throw new Error('Flow does not exist in board');
      }
      const flow = await this.boardFlowRepository.findOne({
        where: { id: flow_id },
        relations: ['users'],
      });
      let userExistInFlow = false;
      flow.users.forEach((users) => {
        if (users.id === user_id) {
          userExistInFlow = true;
        }
      });
      if (userExistInFlow) {
        throw new Error('User already exist in flow');
      }
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      flow.users = [...flow.users, user];
      const boardFlowData = await this.boardFlowRepository.save(flow);
      return boardFlowData;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getFlowById(flow_id: number) {
    try {
      const flow = await this.boardFlowRepository.findOne({
        where: { id: flow_id },
      });
      if (!flow) {
        throw new Error('Flow does not exist');
      }
      return flow;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateBoardFlow(
    boardId: number,
    flowId: number,
    updateBoardFlowDto: UpdateBoardFlowDto,
  ) {
    try {
      const existingFlow = await this.boardFlowRepository.findOne({
        where: { id: flowId, board_id: { id: boardId } },
      });
      if (!existingFlow) {
        throw new Error('Flow does not found');
      }
      Object.assign(existingFlow, updateBoardFlowDto);
      const boardFlowData = await this.boardFlowRepository.save(existingFlow);
      return boardFlowData;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

// Object.assign(existingBoard, updateBoardDto);
// const boardData = await this.boardRepository.save(existingBoard);
