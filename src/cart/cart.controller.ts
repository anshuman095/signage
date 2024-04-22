import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  Req,
  Res,
  UseGuards,
  // UseInterceptors,
  // UploadedFile,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AddMemberDto } from './dto/add-member.dto';
// import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { UserTimeTrackerDto } from './dto/user-time-tracker.dto';
// import { UpdateCartDto } from './dto/update-cart.dto';

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
  // @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createCartDto: CreateCartDto,
    @Req() req: CustomRequest,
    @Res() res: Response,
    // @UploadedFile()
    // file: Express.Multer.File,
  ) {
    try {
      const { id } = req.user;
      // console.log('file here-->', file);
      // console.log('file.buffer-->', file.buffer);
      // const result = await this.cloudinaryService.uploadSingleFile(file.buffer);
      // console.log('result.secure_url', result.secure_url);
      const cart = await this.cartService.createCart(createCartDto, id);
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

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }

  @Get('/getMembersInCart/:cartId')
  async getMembers(@Param('cartId') cartId: number, @Res() res: Response) {
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

  @Post('/addMember')
  async addMembers(
    @Body() addMemberDto: AddMemberDto,
    @Req() req: CustomRequest,
    @Res() res: Response,
  ) {
    try {
      await this.cartService.addMembersInCart(addMemberDto);
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

  @Post('/startTime')
  async startTime(
    @Body() userTimeTrackerDto: UserTimeTrackerDto,
    @Res() res: Response,
  ) {
    try {
      await this.cartService.startTime(userTimeTrackerDto);
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

  @Post('/endTime')
  async endTime(
    @Body() userTimeTrackerDto: UserTimeTrackerDto,
    @Res() res: Response,
  ) {
    try {
      await this.cartService.endTime(userTimeTrackerDto);
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
}
