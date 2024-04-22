import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  // ParseFilePipe,
  // MaxFileSizeValidator,
  // FileTypeValidator,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AuthorizationGuard } from 'src/auth/authorization.guard';
import { CreateBoardFlowDto } from './dto/create-board-flow.dto';

interface CustomRequest extends Request {
  user: { id: number; email: string };
}

@Controller('board')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // @Roles(["SUPERADMIN"])
  @UseGuards(AuthenticationGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('logo'))
  async createBoard(
    @Body(new ValidationPipe()) createBoardDto: CreateBoardDto,
    @Req() req: CustomRequest,
    @Res() res: Response,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    try {
      const { id } = req.user;
      if (!createBoardDto.boardName) {
        throw new Error('Board Name is required');
      }
      const result = await this.cloudinaryService.uploadSingleFile(file.buffer);
      createBoardDto.logo = result.secure_url;
      const board = await this.boardService.createBoard(createBoardDto, id);
      return res.status(201).json({
        success: true,
        board: board,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Patch('/update/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateBoardDetails(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updateBoardDto: UpdateBoardDto,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    try {
      if (updateBoardDto?.logo) {
        const result = await this.cloudinaryService.uploadSingleFile(
          file.buffer,
        );
        updateBoardDto.logo = result.secure_url;
      }

      await this.boardService.updateBoard(+id, updateBoardDto);
      return res.status(201).json({
        success: true,
        message: 'Updated Successfully',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Get('/getAllBoards')
  async getAllBoards(@Req() req: CustomRequest, @Res() res: Response) {
    try {
      const boards = await this.boardService.getAllBoards();
      return res.status(200).json({
        success: true,
        message: boards,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // @Roles(["SUPERADMIN"])
  @UseGuards(AuthenticationGuard)
  @Get('/getMyBoards')
  async getMyBoards(@Req() req: CustomRequest, @Res() res: Response) {
    try {
      const { id } = req.user;
      const boards = await this.boardService.getMyBoards(id);
      return res.status(200).json({
        success: true,
        message: boards,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/flowBoard/fxcg/:boardId')
  async getFlowOfABoard(
    @Param('boardId') boardId: number,
    @Res() res: Response,
  ) {
    try {
      const boardFlow = await this.boardService.getFlowOfABoard(boardId);
      return res.status(200).json({
        success: true,
        message: boardFlow,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/:id')
  async getBoardsById(@Param('id') id: number, @Res() res: Response) {
    try {
      const board = await this.boardService.getBoardsById(id);
      return res.status(200).json({
        success: true,
        message: board,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('/:boardId/:userId')
  async getBoardIdOfUserId(
    @Param('boardId') boardId: number,
    @Param('userId') userId: number,
    @Res() res: Response,
  ) {
    try {
      const board = await this.boardService.getBoardIdOfUserId(boardId, userId);
      return res.status(200).json({
        success: true,
        message: board,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Delete('/deleteBoard/:id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.boardService.deleteBoard(+id);
      return res.status(200).json({
        success: true,
        message: 'Board Deleted Successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Get('/getUsersInBoard/:boardId')
  async getUsersInABoard(
    @Res() res: Response,
    @Param('boardId') boardId: number,
  ) {
    try {
      const users = await this.boardService.getUsersInBoard(boardId);
      return res.status(200).json({
        success: true,
        message: users,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: error.message,
      });
    }
  }

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Delete('/removeUserFromBoard/:boardId/:userId')
  async removeUserFromBoard(
    @Res() res: Response,
    @Param('boardId') boardId: number,
    @Param('userId') userId: number,
  ) {
    try {
      await this.boardService.removeUserFromBoard(boardId, userId);
      return res.status(200).json({
        success: true,
        message: 'User removed from the board successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('/createBoardFlow')
  async createBoardFlow(
    @Body() createBoardFlowDto: CreateBoardFlowDto,
    @Res() res: Response,
  ) {
    try {
      const boardFlow =
        await this.boardService.createBoardFlow(createBoardFlowDto);
      if (!boardFlow.id) {
        throw new Error(boardFlow);
      }
      return res.status(201).json({
        success: true,
        message: boardFlow,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // @Get("/getUsersInBoard/:boardId")
}
