import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { CloudinaryService } from 'src/utility/cloudinary/cloudinary.service';
import { AuthenticationGuard } from 'src/auth/authentication.guard';
import { AuthorizationGuard } from 'src/auth/authorization.guard';

@Controller('board')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body(new ValidationPipe()) createBoardDto: CreateBoardDto,
    @Res() res: Response,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadSingleFile(file.buffer);
      createBoardDto.logo = result.secure_url;
      const board = await this.boardService.createBoard(createBoardDto);
      return res.status(201).json({
        success: true,
        board: board,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  @Get()
  findAll() {
    return this.boardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(+id);
  }

  @Roles(['SUPERADMIN'])
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Patch('/update/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updateBoardDto: UpdateBoardDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (updateBoardDto.logo) {
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardService.remove(+id);
  }
}
