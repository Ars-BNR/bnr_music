import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreatorApplicationDto } from './dto/creator-application.dto';
import { CreatorApplicationsQueryDto } from './dto/creator-applications-query.dto';
import {
  CreateCreatorAlbumDto,
  CreateCreatorTrackDto,
} from './dto/creator-catalog.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { CreatorService } from './creator.service';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string; role: string };
};

@Controller('creator')
@UseGuards(JwtAuthGuard)
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.creatorService.getMe(request.user.sub);
  }

  @Post('application')
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  submitApplication(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatorApplicationDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.creatorService.submitApplication(request.user.sub, dto, avatar);
  }

  @Get('tracks')
  getTracks(
    @Req() request: AuthenticatedRequest,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.creatorService.getTracks(
      request.user.sub,
      pagination.count,
      pagination.offset,
    );
  }

  @Get('albums')
  getAlbums(
    @Req() request: AuthenticatedRequest,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.creatorService.getAlbums(
      request.user.sub,
      pagination.count,
      pagination.offset,
    );
  }

  @Post('tracks')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'picture', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        limits: { files: 2, fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  createTrack(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCreatorTrackDto,
    @UploadedFiles()
    files: { picture?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ) {
    return this.creatorService.createTrack(
      request.user.sub,
      dto,
      files?.picture?.[0],
      files?.audio?.[0],
    );
  }

  @Post('albums')
  @UseInterceptors(
    FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  createAlbum(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCreatorAlbumDto,
    @UploadedFile() picture?: Express.Multer.File,
  ) {
    return this.creatorService.createAlbum(request.user.sub, dto, picture);
  }

  @Get('applications')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getApplications(@Query() query: CreatorApplicationsQueryDto) {
    return this.creatorService.getApplications(
      query.status,
      query.count,
      query.offset,
    );
  }

  @Patch('applications/:id/approve')
  @Roles('admin')
  @UseGuards(RolesGuard)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.creatorService.approve(id, request.user.sub);
  }

  @Patch('applications/:id/reject')
  @Roles('admin')
  @UseGuards(RolesGuard)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.creatorService.reject(id, request.user.sub, dto.reviewNote);
  }
}
