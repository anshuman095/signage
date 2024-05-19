import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Put,
  Patch,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { UserTimeTrackerDto } from './dto/user-time-tracker.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateCartChecklistDto } from './dto/create-cart-checklist.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateTaskCompleteDto } from './dto/create-task-complete.dto';
import { MoveCartDto } from './dto/move-cart.dto';

interface CustomRequest extends Request {
  user: { id: number; email: string };
}

@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AuthenticationGuard)
  @Post('/create')
  @UseInterceptors(FilesInterceptor('attachment_url'))
  async create(
    @Body() createCartDto: CreateCartDto,
    @Req() req: CustomRequest,
    @Res() res: Response,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const { id } = req.user;
      const cart = await this.cartService.createCart(createCartDto, id, files);
      return res.status(201).json({
        success: true,
        message: cart,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/create/label')
  async createLabel(
    @Req() req: CustomRequest,
    @Body() createLabelDto: CreateLabelDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const label = await this.cartService.createLabel(createLabelDto, id);
      return res.status(201).json({
        success: true,
        message: label,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getLabel')
  async getLabel(@Body() createLabelDto: CreateLabelDto, @Res() res: Response) {
    try {
      const label = await this.cartService.getLabel();
      return res.status(201).json({
        success: true,
        message: label,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  @Get('/getMembersInBoard/:boardId')
  async getMembersInABoard(
    @Param('boardId') boardId: number,
    // @Query("email") email: string,
    @Res() res: Response,
  ) {
    try {
      const members = await this.cartService.getMembersInBoard(boardId);
      return res.status(200).json({
        success: true,
        message: members,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/addMember')
  async addMembers(
    @Body() addMemberDto: AddMemberDto,
    @Req() req: CustomRequest,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      await this.cartService.addMembersInCart(addMemberDto, id);
      return res.status(201).json({
        success: true,
        message: 'Member added successfully!',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getMembersInCart/:cartId')
  async getMembersInACart(
    @Param('cartId') cartId: number,
    @Res() res: Response,
  ) {
    try {
      const members = await this.cartService.getMembersInCart(cartId);
      return res.status(200).json({
        success: true,
        message: members,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Get('/getCartById/:cartId')
  async getCartById(
    @Param('cartId') cartId: number,
    @Req() req: CustomRequest,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const cart = await this.cartService.getCartById(cartId, id);
      return res.status(200).json({
        success: true,
        message: cart,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/addChecklist')
  async addChecklistIntoCart(
    @Req() req: CustomRequest,
    @Body() createCartChecklistDto: CreateCartChecklistDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const checklist = await this.cartService.addChecklistIntoCart(
        createCartChecklistDto,
        id,
      );
      return res.status(201).json({
        success: true,
        message: checklist,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getChecklistById/:checklistId')
  async getChecklistById(
    @Param('checklistId') checklistId: number,
    @Res() res: Response,
  ) {
    try {
      const checklist = await this.cartService.getChecklistById(checklistId);
      return res.status(200).json({
        success: true,
        message: checklist,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getAllCart')
  async getAllCart(@Res() res: Response) {
    try {
      const cart = await this.cartService.getAllCarts();
      console.log('cart in controller-->', cart);

      return res.status(200).json({
        success: true,
        message: cart,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/startTime')
  async startTime(
    @Req() req: CustomRequest,
    @Body() userTimeTrackerDto: UserTimeTrackerDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const data = await this.cartService.startTime(userTimeTrackerDto, id);
      return res.status(201).json({
        success: true,
        message: data,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/endTime')
  async endTime(
    @Req() req: CustomRequest,
    @Body() userTimeTrackerDto: UserTimeTrackerDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const trackingDetails = await this.cartService.endTime(
        userTimeTrackerDto,
        id,
      );
      return res.status(201).json({
        success: true,
        message: trackingDetails,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/comment')
  async createComment(
    @Req() req: CustomRequest,
    @Body() createCommentDto: CreateCommentDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const comment = await this.cartService.createComment(
        createCommentDto,
        id,
      );
      return res.status(201).json({
        success: true,
        message: comment,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getAllCommentsOfCart/:cartId')
  async getAllCommentsOfCart(
    @Param('cartId') cartId: number,
    @Res() res: Response,
  ) {
    try {
      const comments = await this.cartService.getAllCommentsOfACart(cartId);
      return res.status(200).json({
        success: true,
        message: comments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Post('/attachFile')
  // @UseInterceptors(FileFieldsInterceptor([
  //   { name: 'files', maxCount: 10 },
  // ]))
  @UseInterceptors(FilesInterceptor('attachment_url'))
  async createAttachment(
    @Req() req: CustomRequest,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createAttachmentDto: CreateAttachmentDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      const attachments = await this.cartService.createAttachment(
        createAttachmentDto,
        id,
        files,
      );
      return res.status(201).json({
        success: true,
        message: attachments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Put('/taskComplete')
  async taskComplete(
    @Req() req: CustomRequest,
    @Body() createTaskCompleteDto: CreateTaskCompleteDto,
    @Res() res: Response,
  ) {
    try {
      const { id } = req.user;
      await this.cartService.taskComplete(createTaskCompleteDto, id);
      return res.status(201).json({
        success: true,
        message: 'Task Completed!',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Patch('/moveCartToNext')
  async moveCartToNext(@Body() moveCartDto: MoveCartDto, @Res() res: Response) {
    try {
      await this.cartService.moveCart(moveCartDto);
      return res.status(201).json({
        success: true,
        message: 'Cart successfully moved to the next cart',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getAllCartsOfBoard/:boardId')
  async getAllCartsOfABoard(
    @Param('boardId') boardId: number,
    @Res() res: Response,
  ) {
    try {
      const carts = await this.cartService.getAllCartsOfABoard(boardId);
      return res.status(200).json({
        success: true,
        message: carts,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getAttachmentsOfCart/:cartId')
  async getAttachmentsOfACart(
    @Param('cartId') cartId: number,
    @Res() res: Response,
  ) {
    try {
      const attachments =
        await this.cartService.getAllAttachmentsOfCart(cartId);
      return res.status(200).json({
        success: true,
        message: attachments,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/getHistoryOfCart/:cartId')
  async getHistoryOfACart(
    @Param('cartId') cartId: number,
    @Res() res: Response,
  ) {
    try {
      const history = await this.cartService.getHistoryOfCart(cartId);
      return res.status(200).json({
        success: true,
        message: history,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
