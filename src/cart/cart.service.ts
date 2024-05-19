import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CartEntity } from './entities/cart.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { TaskStatus, UserEntity } from 'src/user/entities/user.entity';
import { UserTimeTrackerEntity } from './entities/user-time-tracker.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserTimeTrackerDto } from './dto/user-time-tracker.dto';
import { LabelEntity } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateCartChecklistDto } from './dto/create-cart-checklist.dto';
import { CartChecklistEntity } from './entities/cart-checklist.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { SocketService } from '../socket/socket.gateway';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AttachmentEntity } from './entities/attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateTaskCompleteDto } from './dto/create-task-complete.dto';
import { BoardFlowEntity } from 'src/board/entities/board-flow.entity';
import { MoveCartDto } from './dto/move-cart.dto';
import { EmailService } from 'src/utility/email.service';
import { CartHistoryEntity } from './entities/cart-history.entity';
import { AddMemberCartChecklistDto } from './dto/add-member-cart-checklist.dto';

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

    @InjectRepository(BoardFlowEntity)
    private boardFlowRepository: Repository<BoardFlowEntity>,

    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,

    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,

    @InjectRepository(CartHistoryEntity)
    private cartHistoryRepository: Repository<CartHistoryEntity>,

    private readonly socketService: SocketService,

    private readonly cloudinaryService: CloudinaryService,

    private readonly emailService: EmailService,
  ) {}
  async createCart(createCartDto: CreateCartDto, userId: number, files) {
    try {
      const { board_id } = createCartDto;
      if (!board_id) {
        throw new Error('Board Id is required!');
      }
      const board = await this.boardRepository.findOne({
        where: { id: board_id },
        relations: ['flows'],
      });
      const flow = board.flows[0];
      if (!flow) {
        throw new Error('Create firstly flow for board ' + board.boardName);
      }
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found!');
      }
      const newCart = this.cartRepository.create({
        ...createCartDto,
        board_id: board,
        created_by: user,
        flow_id: flow,
      });
      const cart = await this.cartRepository.save(newCart);

      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['members', 'labels', 'attachments', 'cart_history'],
      });

      if (createCartDto.label_name) {
        const label = await this.createLabel(
          {
            cart_id: cartDetails.id,
            label_name: createCartDto.label_name,
            color_code: createCartDto.color_code,
          },
          user.id,
        );
        cartDetails.labels = [...cartDetails?.labels, label];
        await this.cartRepository.save(cartDetails);
      }
      if (createCartDto.checklist_title) {
        const createCartChecklistDto = {
          cart_id: cartDetails.id,
          checklist_title: createCartDto.checklist_title,
          checklist_status: Boolean(createCartDto?.checklist_status),
        };
        await this.addChecklistIntoCart(createCartChecklistDto, user.id);
        // cartDetails.attachments = [...cartDetails?.attachments, checklist];
        // await this.cartRepository.save(cart);
      }
      if (files.length > 0) {
        const createAttachmentDto = {
          cart_id: cartDetails.id,
          attachment_url: createCartDto.attachment_url,
        };
        const attachment = await this.createAttachment(
          createAttachmentDto,
          userId,
          files,
        );
        console.log('attachment last', attachment);
        cartDetails.attachments = [...cartDetails?.attachments, attachment];
        await this.cartRepository.save(cart);
      }
      if (createCartDto.user_id) {
        console.log('5');
        const addMemberDto = {
          cart_id: cartDetails.id,
          user_id: Number(createCartDto.user_id),
        };
        const members = await this.addMembersInCart(addMemberDto, user.id);
        cartDetails.members = [...cartDetails.members, members.members[0]];
        await this.cartRepository.save(cartDetails);
      }
      const new_history = this.cartHistoryRepository.create({
        history_message: `${user.fName} ${user.lName} created a task ${cart.cart_title}`,
        cart_id: cartDetails,
        created_by: user,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cartDetails.cart_history = [...cartDetails?.cart_history, history];
      await this.cartRepository.save(cartDetails);
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createLabel(createLabelDto: CreateLabelDto, userId: number) {
    try {
      const { cart_id } = createLabelDto;
      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['labels', 'cart_history'],
      });
      const newLabel = this.labelRepository.create({
        ...createLabelDto,
        cart_id: cart,
      });
      const label = await this.labelRepository.save(newLabel);

      cart.labels = [...cart.labels, label];
      await this.cartRepository.save(cart);

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      const new_history = this.cartHistoryRepository.create({
        history_message: `${user.fName} ${user.lName} created a label ${label.label_name}`,
        cart_id: cart,
        created_by: user,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cart.cart_history = [...cart?.cart_history, history];
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

  async getMembersInBoard(boardId: number) {
    try {
      const { users } = await this.boardRepository
        .createQueryBuilder('board')
        .leftJoinAndSelect('board.users', 'users')
        .where('board.id = :id', { id: boardId })
        .getOne();

      return users;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addMembersInCart(addMemberDto: AddMemberDto, loggedInUserId: number) {
    try {
      const { cart_id, user_id } = addMemberDto;
      console.log('user_id', user_id);

      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['board_id', 'members', 'cart_history'],
      });

      let userExistsInCart = false;
      for (let i = 0; i < cart.members.length; i++) {
        if (cart.members[i].id === user_id) {
          userExistsInCart = true;
          break;
        }
      }
      if (userExistsInCart) {
        throw new Error('User is already a member of the cart');
      }

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

      const loggedInUserData = await this.userRepository.findOne({
        where: { id: loggedInUserId },
      });

      const new_history = this.cartHistoryRepository.create({
        history_message: `A new user ${user.fName} ${user.lName} is added in the cart by ${loggedInUserData.fName} ${loggedInUserData.lName}`,
        cart_id: cart,
        created_by: user,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cart.cart_history = [...cart?.cart_history, history];
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

  async getCartById(cartId: number, userId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found');
      }
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
          'attachments',
          'attachments.attach_by',
          'cart_history',
          'flow_id',
        ],
      });
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addChecklistIntoCart(
    createCartChecklistDto: CreateCartChecklistDto,
    userId: number,
  ) {
    try {
      console.log('3');
      const { cart_id } = createCartChecklistDto;

      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['members', 'checklists', 'cart_history'],
      });

      const creatingUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      const newChecklist = this.cartChecklistRepository.create({
        ...createCartChecklistDto,
        cart_id: cart,
        created_by: creatingUser,
      });
      const checklist = await this.cartChecklistRepository.save(newChecklist);

      // const checklistDetails = await this.cartChecklistRepository.findOne({
      //   where: { id: checklist.id },
      //   relations: ["checklist_users"],
      // });
      // checklistDetails.checklist_users = [
      //   ...checklistDetails.checklist_users,
      //   user,
      // ];
      // await this.cartChecklistRepository.save(checklistDetails);

      cart.checklists = [...cart.checklists, checklist];

      const new_history = this.cartHistoryRepository.create({
        history_message: `A new issue is added in the checklist by ${creatingUser.fName} ${creatingUser.lName}`,
        cart_id: cart,
        created_by: creatingUser,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cart.cart_history = [...cart?.cart_history, history];
      await this.cartRepository.save(cart);
      await this.cartRepository.save(cart);
      return checklist;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addMembersInChecklistOfCart(
    logginUserId: number,
    addMemberCartChecklistDto: AddMemberCartChecklistDto,
  ) {
    const cart = await this.cartRepository.findOne({
      where: { id: addMemberCartChecklistDto.cart_id },
      relations: ['cart_history'],
    });
    let userExist = false;
    for (let i = 0; i < cart.members.length; i++) {
      if (cart.members[i].id === addMemberCartChecklistDto.user_id) {
        userExist = true;
        break;
      }
    }
    if (!userExist) {
      throw new Error('User does not exist in cart');
    }
    const user = await this.userRepository.findOne({
      where: { id: addMemberCartChecklistDto.user_id },
    });
    const checklistDetails = await this.cartChecklistRepository.findOne({
      where: { id: addMemberCartChecklistDto.checklist_id },
      relations: ['checklist_users'],
    });
    checklistDetails.checklist_users = [
      ...checklistDetails.checklist_users,
      user,
    ];
    await this.cartChecklistRepository.save(checklistDetails);

    const loggedInUserData = await this.userRepository.findOne({
      where: { id: logginUserId },
    });
    const new_history = this.cartHistoryRepository.create({
      history_message: `A new user ${user.fName} ${user.lName} is added in the checklist by ${loggedInUserData.fName} ${loggedInUserData.lName}`,
      cart_id: cart,
      created_by: loggedInUserData,
    });
    const history = await this.cartHistoryRepository.save(new_history);
    cart.cart_history = [...cart?.cart_history, history];
    await this.cartRepository.save(cart);
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
          'attachments',
          'attachments.attach_by',
          'cart_history',
          'flow_id',
        ],
      });
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
        relations: [
          'members',
          'board_id',
          'user_time_tracker',
          'comments',
          'cart_history',
        ],
      });
      console.log('cartDetails.members', cartDetails.members);
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

      const new_history = this.cartHistoryRepository.create({
        history_message: `${user.fName} ${user.lName} commented ${createComment.comment_message}`,
        cart_id: cartDetails,
        created_by: user,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cartDetails.cart_history = [...cartDetails?.cart_history, history];
      await this.cartRepository.save(cartDetails);

      return comment;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createAttachment(
    createAttachmentDto: CreateAttachmentDto,
    user_id: number,
    files,
  ): Promise<AttachmentEntity> {
    try {
      const { cart_id } = createAttachmentDto;

      const cartDetails = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: [
          'members',
          'board_id',
          'user_time_tracker',
          'comments',
          'attachments',
          'cart_history',
        ],
      });

      // let userExist = false;
      // cartDetails?.members.forEach((element) => {
      //   if (element.id === user_id) {
      //     userExist = true;
      //   }
      // });

      // if (!userExist) {
      //   throw new Error("User does not exist in cart");
      // }

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });

      const attachmentUrl = await this.cloudinaryService.uploadFiles(files);

      console.log('44');
      createAttachmentDto.attachment_url = [];
      for (let i = 0; i < attachmentUrl.length; i++) {
        createAttachmentDto.attachment_url.push(attachmentUrl[i].secure_url);
      }

      console.log('45');
      console.log('cartDetails');
      const new_attachment = this.attachmentRepository.create({
        cart_id: cartDetails,
        attach_by: user,
        attachment_url: createAttachmentDto.attachment_url,
      });
      const attachment = await this.attachmentRepository.save(new_attachment);
      console.log('attachment in function', attachment);

      cartDetails.attachments = [...cartDetails.attachments, attachment];
      // await this.cartRepository.save(cartDetails);

      const new_history = this.cartHistoryRepository.create({
        history_message: `${user.fName} ${user.lName} attched ${attachmentUrl.length}`,
        cart_id: cartDetails,
        created_by: user,
      });
      const history = await this.cartHistoryRepository.save(new_history);
      cartDetails.cart_history = [...cartDetails?.cart_history, history];
      await this.cartRepository.save(cartDetails);

      return attachment;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllCommentsOfACart(cartId: number) {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['comments'],
      });
      return cart.comments;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async taskComplete(
    createTaskCompleteDto: CreateTaskCompleteDto,
    user_id: number,
  ) {
    try {
      const { board_id, flow_id, cart_id } = createTaskCompleteDto;
      const board = await this.boardRepository.findOne({
        where: { id: board_id },
        relations: ['flows'],
      });
      let flowExist = false;
      board.flows.forEach((flow) => {
        if (flow.id === flow_id) {
          flowExist = true;
        }
      });
      if (!flowExist) {
        throw new Error('Flow does not exist in board');
      }
      let userExist = false;
      const flow = await this.boardFlowRepository.findOne({
        where: { id: flow_id },
        relations: ['users'],
      });
      flow.users.forEach((user) => {
        if (user.id === user_id) {
          userExist = true;
        }
      });
      if (!userExist) {
        throw new Error('User does not exist in flow');
      }
      const cart = await this.cartRepository.findOne({
        where: { id: cart_id },
        relations: ['board_id'],
      });

      if (board_id !== cart?.board_id.id) {
        throw new Error('Cart does not belong to board');
      }
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      user.task_status = TaskStatus.COMPLETED;
      return await this.userRepository.save(user);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async moveCart(moveCartDto: MoveCartDto) {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: moveCartDto.cart_id },
        relations: ['flow_id', 'flow_id.users', 'board_id.flows'],
      });

      const allCompleted = cart.flow_id.users.every(
        (user) => user.task_status === 'COMPLETED',
      );

      if (!allCompleted) {
        throw new Error(
          'You cannot move the cart to the next stage because not all users have completed their tasks.',
        );
      }
      const nextBoardFlow = await this.boardFlowRepository.findOne({
        where: {
          board_id: { id: cart.board_id.id },
          index: +cart.flow_id.index + 1,
        },
        relations: ['users'],
      });
      console.log('nextBoardFlow-->', nextBoardFlow);

      cart.flow_id = nextBoardFlow;
      await this.cartRepository.save(cart);

      for (const user of nextBoardFlow.users) {
        user.task_status = TaskStatus.COMPLETED;
        await this.userRepository.save(user);
      }

      const userEmails = nextBoardFlow.users.map((user) => user.email);

      const taskUpdateLink = `${process.env.TASKUPDATE_URL}`;
      console.log('taskUpdateLink', taskUpdateLink);

      const emailData = {
        subject: 'Task Update',
        html: `Now you can start the task <a href="${taskUpdateLink}">${taskUpdateLink}</a>`,
      };
      await this.emailService.sendEmail(userEmails, emailData);
      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllCartsOfABoard(boardId: number) {
    try {
      const carts = await this.cartRepository.find({
        where: { board_id: { id: boardId } },
        relations: [
          'created_by',
          'updated_by',
          'board_id',
          'members',
          'checklists',
          'checklists.checklist_users',
          'labels',
          'user_time_tracker',
          'attachments',
          'attachments.attach_by',
          'flow_id',
        ],
        order: { created_at: 'DESC' },
      });
      return carts;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllAttachmentsOfCart(cartId: number) {
    try {
      const carts = await this.cartRepository.find({
        where: { id: cartId },
        relations: ['attachments'],
        select: ['attachments'],
      });
      return carts;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getHistoryOfCart(cartId: number) {
    try {
      const history = await this.cartHistoryRepository.find({
        where: { cart_id: { id: cartId } },
        relations: ['created_by', 'cart_id'],
      });
      return history;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
