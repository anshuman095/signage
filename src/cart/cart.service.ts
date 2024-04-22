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

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,

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
      console.log('userId', userId);
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

  async getMembersInCart(cartId: number) {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['board_id'],
      });
      const { users } = await this.boardRepository.findOne({
        where: { id: cart.board_id.id },
        relations: ['users'],
      });
      return users;
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

  async startTime(userTimeTrackerDto: UserTimeTrackerDto) {
    try {
      const { cart_id, user_id, board_id } = userTimeTrackerDto;
      const cart = await this.userTimeTrackerRepository.findOne({
        where: {
          cart_id: { id: cart_id },
          user_id: { id: user_id },
          board_id: { id: board_id },
        },
      });
      console.log('cart-->', cart);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async endTime(userTimeTrackerDto: UserTimeTrackerDto) {
    try {
      const { cart_id, user_id, board_id } = userTimeTrackerDto;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
