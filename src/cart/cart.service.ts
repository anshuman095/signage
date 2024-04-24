import { Injectable } from '@nestjs/common';
// import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from './entities/cart.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserTimeTrackerEntity } from './entities/user-time-tracker.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserTimeTrackerDto } from './dto/user-time-tracker.dto';
import { LabelEntity } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateCartChecklistDto } from './dto/create-cart-checklist.dto ';
import { CartChecklistEntity } from './entities/cart-checklist.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,

    @InjectRepository(LabelEntity)
    private labelRepository: Repository<LabelEntity>,

    @InjectRepository(CartChecklistEntity)
    private cartChecklistRepository: Repository<CartChecklistEntity>,

    @InjectRepository(UserTimeTrackerEntity)
    private userTimeTrackerRepository: Repository<UserTimeTrackerEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(BoardEntity)
    private boardRepository: Repository<BoardEntity>,
  ) {}
  async createCart(createCartDto: CreateCartDto, userId: number) {
    try {
      const { board_id } = createCartDto;
      if (!board_id) {
        throw new Error('Board Id is required!');
      }
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      const newCart = this.cartRepository.create({
        ...createCartDto,
        board_id: board_id,
        created_by: user,
      });
      const cart = await this.cartRepository.save(newCart);
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createLabel(createLabelDto: CreateLabelDto) {
    try {
      const newLabel = this.labelRepository.create(createLabelDto);
      const label = await this.labelRepository.save(newLabel);
      // await this.c
      return label;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getLabel() {
    try {
      const label = await this.labelRepository.find();
      return label;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  // update(id: number, updateCartDto: UpdateCartDto) {
  //   return `This action updates a #${id} cart`;
  // }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }

  async getMembersInBoard(boardId: number, email: string) {
    try {
      const { users } = await this.boardRepository
        .createQueryBuilder('board')
        .leftJoinAndSelect('board.users', 'users')
        .where('board.id = :id', { id: boardId })
        .andWhere('users.email LIKE :email', { email: `%${email}%` })
        .getOne();

      return users;
      // let query = this.boardRepository
      //   .createQueryBuilder("board")
      //   .leftJoinAndSelect("board.users", "users")
      //   .where("board.id = :id", { id: boardId });

      // if (email) {
      //   query = query.andWhere("users.email LIKE :email", {
      //     email: `%${email}%`,
      //   });
      // }
      // const { users } = await query.getOne();
      // return users;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addMembersInCart(addMemberDto: AddMemberDto) {
    try {
      const { cart_id, user_id } = addMemberDto;

      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['board_id', 'members'],
      });

      const board = await this.boardRepository.findOne({
        where: { id: cart.board_id.id },
        relations: ['users', 'flows', 'createdBy'],
      });

      let userExists = false;
      for (let i = 0; i < board.users.length; i++) {
        if (board.users[i].id === user_id) {
          userExists = true;
          break;
        }
      }
      if (!userExists) {
        throw new Error('User not found in board');
      }

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      cart.members = [...cart.members, user];
      await this.cartRepository.save(cart);
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getMembersInCart(cartId: number) {
    try {
      const query = await this.cartRepository
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.members', 'members')
        .where('cart.id = :id', { id: cartId })
        .getOne();

      const { members } = query;
      return members;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async startTime(userTimeTrackerDto: UserTimeTrackerDto) {
    try {
      const { cart_id, user_id, board_id } = userTimeTrackerDto;
      await this.userTimeTrackerRepository.findOne({
        where: {
          cart_id: { id: cart_id },
          user_id: { id: user_id },
          board_id: { id: board_id },
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async endTime(userTimeTrackerDto: UserTimeTrackerDto) {
    try {
      console.log(userTimeTrackerDto);
      // const { cart_id, user_id, board_id } = userTimeTrackerDto;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getCartById(cartId: number) {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: [
          'created_by',
          'updated_by',
          'board_id',
          'members',
          'checklists',
          'checklists.checklist_users',
        ],
      });
      delete cart.created_by.password;
      if (cart.updated_by) {
        delete cart.updated_by.password;
      }

      cart.members.map((members) => {
        delete members.password;
      });
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addChecklistIntoCart(createCartChecklistDto: CreateCartChecklistDto) {
    try {
      const { user_id, cart_id } = createCartChecklistDto;

      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'checklists'],
      });

      let userExist = false;
      for (let i = 0; i < cart.members.length; i++) {
        if (cart.members[i].id === user_id) {
          userExist = true;
          break;
        }
      }
      if (!userExist) {
        throw new Error('User does not exist in cart');
      }

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      const checklistExist = await this.cartChecklistRepository.findOne({
        where: { checklist_title: createCartChecklistDto.checklist_title },
        relations: ['checklist_users'],
      });

      if (checklistExist) {
        checklistExist.checklist_users = [
          ...checklistExist.checklist_users,
          user,
        ];
        const checklistExistData =
          await this.cartChecklistRepository.save(checklistExist);
        return checklistExistData;
      }

      const newChecklist = this.cartChecklistRepository.create({
        ...createCartChecklistDto,
        cart_id: cart,
      });
      const checklist = await this.cartChecklistRepository.save(newChecklist);

      const checklistDetails = await this.cartChecklistRepository.findOne({
        where: { id: checklist.id },
        relations: ['checklist_users'],
      });
      checklistDetails.checklist_users = [
        ...checklistDetails.checklist_users,
        user,
      ];
      await this.cartChecklistRepository.save(checklistDetails);

      cart.checklists = [...cart.checklists, checklist];
      await this.cartRepository.save(cart);
      return checklist;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getChecklistById(checklistId: number) {
    try {
      const checklist = await this.cartChecklistRepository.findOne({
        where: { id: checklistId },
        relations: ['checklist_users'],
      });
      if (!checklist) {
        throw new Error('Checklist does not exist');
      }
      return checklist;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllCart() {
    try {
      const cart = await this.cartRepository.find({
        relations: [
          'created_by',
          'updated_by',
          'board_id',
          'members',
          'checklists',
          'checklists.checklist_users',
        ],
      });
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
