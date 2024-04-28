import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
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
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { SocketService } from '../socket/socket.gateway';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AttachmentEntity } from './entities/attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

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

    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,

    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,

    private readonly socketService: SocketService,

    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async createCart(createCartDto: CreateCartDto, userId: number) {
    try {
      const { board_id } = createCartDto;
      if (!board_id) {
        throw new Error('Board Id is required!');
      }
      const board = await this.boardRepository.findOne({
        where: { id: board_id },
        relations: ['flows'],
      });
      console.log('board.flows-->', board.flows);
      const flow = board.flows[0];
      console.log('flow-->', flow);
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      const newCart = this.cartRepository.create({
        ...createCartDto,
        board_id: board,
        created_by: user,
        boardFlow: flow,
      });
      const cart = await this.cartRepository.save(newCart);
      delete cart.created_by.password;
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createLabel(createLabelDto: CreateLabelDto) {
    try {
      const { cart_id } = createLabelDto;
      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['labels'],
      });
      const newLabel = this.labelRepository.create({
        ...createLabelDto,
        cart_id: cart,
      });
      const label = await this.labelRepository.save(newLabel);

      cart.labels = [...cart.labels, label];
      await this.cartRepository.save(cart);
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
          'labels',
          'user_time_tracker',
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

  async getAllCarts() {
    try {
      const cart = await this.cartRepository.find({
        relations: [
          'created_by',
          'updated_by',
          'board_id',
          'members',
          'checklists',
          'checklists.checklist_users',
          'labels',
          'user_time_tracker',
        ],
      });
      console.log(cart);
      if (!cart) {
        throw new Error('Cart does not');
      }
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async startTime(userTimeTrackerDto: UserTimeTrackerDto, user_id: number) {
    try {
      const { cart_id, board_id } = userTimeTrackerDto;
      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'board_id', 'user_time_tracker'],
      });
      if (cartDetails.board_id.id !== board_id) {
        throw new Error('Cart does not belong to board');
      }
      let userExist = false;
      cartDetails.members.forEach((element) => {
        if (element.id === user_id) {
          userExist = true;
        }
      });

      if (!userExist) {
        throw new Error('User does not exist in cart');
      }
      const board = await this.boardRepository.findOne({
        where: { id: board_id },
      });
      if (!board) {
        throw new Error('Board does not exist');
      }

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      const timeTrack = await this.userTimeTrackerRepository.findOne({
        where: {
          cart_id: { id: cart_id },
          user_id: { id: user_id },
          board_id: { id: board_id },
        },
      });

      if (timeTrack) {
        const newTimeTrack = this.userTimeTrackerRepository.create({
          board_id: board,
          start_time: userTimeTrackerDto.start_date,
          cart_id: cartDetails,
          start_date: userTimeTrackerDto.start_date,
          user_id: user,
          total_time: timeTrack.time_worked_so_far,
        });
        const trackingDetails =
          await this.userTimeTrackerRepository.save(newTimeTrack);
        cartDetails.user_time_tracker = [
          ...cartDetails.user_time_tracker,
          trackingDetails,
        ];
        await this.cartRepository.save(cartDetails);
        return trackingDetails;
      } else {
        const timeTracker = this.userTimeTrackerRepository.create({
          ...userTimeTrackerDto,
          board_id: board,
          start_time: userTimeTrackerDto.start_date,
          cart_id: cartDetails,
          start_date: userTimeTrackerDto.start_date,
          user_id: user,
        }) as unknown as UserTimeTrackerEntity;

        const data = await this.userTimeTrackerRepository.save(timeTracker);
        cartDetails.user_time_tracker = [
          ...cartDetails.user_time_tracker,
          data,
        ];
        await this.cartRepository.save(cartDetails);
        return data;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async endTime(userTimeTrackerDto: UserTimeTrackerDto, user_id: number) {
    try {
      const { cart_id, board_id } = userTimeTrackerDto;
      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'board_id', 'user_time_tracker'],
      });
      if (cartDetails.board_id.id !== board_id) {
        throw new Error('Cart does not belong to board');
      }
      const timeTrack = await this.userTimeTrackerRepository.findOne({
        where: {
          start_time: Not(IsNull()),
          user_id: { id: user_id },
          cart_id: { id: cart_id },
          board_id: { id: board_id },
          end_time: IsNull(),
        },
      });

      if (timeTrack) {
        const { start_time } = timeTrack;
        const { end_date } = userTimeTrackerDto;
        if (end_date < start_time) {
          throw new Error('End time should be greater than start time');
        }
        const startMoment = moment.unix(start_time);
        const endMoment = moment.unix(end_date);

        const duration = moment.duration(endMoment.diff(startMoment));

        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        timeTrack.time_worked_so_far = `${hours}hr ${minutes}min ${seconds}sec`;

        if (timeTrack.total_time !== null) {
          const [h1, m1, s1] = timeTrack?.time_worked_so_far
            .match(/\d+/g)
            .map(Number);
          const [h2, m2, s2] = timeTrack?.total_time.match(/\d+/g).map(Number);
          const h = h1 + h2,
            m = m1 + m2,
            s = s1 + s2;
          const carry = Math.floor(s / 60);
          // eslint-disable-next-line no-var
          var result = `${h + Math.floor((m + carry) / 60)}hr ${(m + carry) % 60}min ${s % 60}sec`;
        }

        timeTrack.total_time = result ? result : timeTrack.time_worked_so_far;
        timeTrack.end_time = end_date;
        timeTrack.end_date = end_date;

        const trackingDetails =
          await this.userTimeTrackerRepository.save(timeTrack);

        return trackingDetails;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createComment(createCommentDto: CreateCommentDto, user_id: number) {
    try {
      const { cart_id } = createCommentDto;
      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'board_id', 'user_time_tracker', 'comments'],
      });
      let userExist = false;
      cartDetails.members.forEach((element) => {
        if (element.id === user_id) {
          userExist = true;
        }
      });

      if (!userExist) {
        throw new Error('User does not exist in cart');
      }
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      const createComment = this.commentRepository.create({
        ...createCommentDto,
        cart_id: cartDetails,
        commented_by: user,
      });
      const comment = await this.commentRepository.save(createComment);

      cartDetails.comments = [...cartDetails.comments, comment];
      await this.cartRepository.save(cartDetails);

      const receiverSocketId = this.socketService.getReceiverSocketId(
        cartDetails.id.toString(),
      );
      if (receiverSocketId) {
        this.socketService.emitNewComment(receiverSocketId, comment);
      }
      return comment;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createAttachment(
    createAttachmentDto: CreateAttachmentDto,
    user_id: number,
    files,
  ) {
    // : Promise<AttachmentEntity[]>
    try {
      const { cart_id } = createAttachmentDto;

      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'board_id', 'user_time_tracker', 'comments'],
      });
      let userExist = false;
      cartDetails.members.forEach((element) => {
        if (element.id === user_id) {
          userExist = true;
        }
      });

      if (!userExist) {
        throw new Error('User does not exist in cart');
      }

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      console.log(user);
      console.log(files);

      const attachmentUrl = await this.cloudinaryService.uploadFiles(files);
      for (let i = 0; i < attachmentUrl.length; i++) {
        createAttachmentDto.attachment_url.push(attachmentUrl[i].secure_url);
      }

      // for(let i = 0; i < attachmentUrl.length; i++) {
      //   createAttachmentDto.attachment_url.push(attachmentUrl)
      // }
      console.log(
        'createAttachmentDto.attachment_url->',
        createAttachmentDto.attachment_url,
      );

      // return attachments;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
