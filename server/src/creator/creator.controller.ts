import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AuthenticatedPrincipal } from 'src/rbac/rbac.constants';
import { CreatorApplicationDto } from './dto/creator-application.dto';
import { CreatorApplicationsQueryDto } from './dto/creator-applications-query.dto';
import {
  CreateCreatorAlbumDto,
  CreateCreatorTrackDto,
  AssignCreatorAlbumTracksDto,
  ReplaceCreatorAlbumCompositionDto,
  UpdateCreatorAlbumDto,
  UpdateCreatorTrackDto,
  CreatorCatalogQueryDto,
  BulkDeleteCreatorReleasesDto,
} from './dto/creator-catalog.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import {
  DeleteCreatorProfileDto,
  UpdateCreatorProfileDto,
} from './dto/creator-profile.dto';
import { CreatorService } from './creator.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedPrincipal;
};

@Controller('creator')
@UseGuards(JwtAuthGuard)
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.creatorService.getMe(request.user.sub);
  }

  @Patch('me')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCreatorProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.creatorService.updateProfile(request.user.sub, dto, avatar);
  }

  @Delete('me')
  @Permissions('creator.apply')
  @UseGuards(PermissionsGuard)
  deleteMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DeleteCreatorProfileDto,
  ) {
    return this.creatorService.deleteProfile(request.user.sub, dto);
  }

  @Post('application')
  @Permissions('creator.apply')
  @UseGuards(PermissionsGuard)
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
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  getTracks(
    @Req() request: AuthenticatedRequest,
    @Query() pagination: CreatorCatalogQueryDto,
  ) {
    return this.creatorService.getTracks(
      request.user.sub,
      pagination.count,
      pagination.offset,
      pagination.query,
    );
  }

  @Get('albums')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  getAlbums(
    @Req() request: AuthenticatedRequest,
    @Query() pagination: CreatorCatalogQueryDto,
  ) {
    return this.creatorService.getAlbums(
      request.user.sub,
      pagination.count,
      pagination.offset,
      pagination.query,
    );
  }

  @Post('tracks')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
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
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.creatorService.createTrack(
      request.user.sub,
      dto,
      files?.picture?.[0],
      files?.audio?.[0],
      idempotencyKey,
    );
  }

  @Get('tracks/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  getTrack(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.creatorService.getTrack(request.user.sub, id);
  }

  @Patch('tracks/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'picture', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      { limits: { files: 2, fileSize: 50 * 1024 * 1024 } },
    ),
  )
  updateTrack(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCreatorTrackDto,
    @UploadedFiles()
    files: { picture?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ) {
    return this.creatorService.updateTrack(
      request.user.sub,
      id,
      dto,
      files?.picture?.[0],
      files?.audio?.[0],
    );
  }

  @Delete('tracks/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  deleteTrack(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.creatorService.deleteTracks(request.user.sub, [id]);
  }

  @Post('tracks/bulk-delete')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  bulkDeleteTracks(
    @Req() request: AuthenticatedRequest,
    @Body() dto: BulkDeleteCreatorReleasesDto,
  ) {
    return this.creatorService.deleteTracks(request.user.sub, dto.ids);
  }

  @Post('albums')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  @UseInterceptors(
    FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  createAlbum(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCreatorAlbumDto,
    @UploadedFile() picture?: Express.Multer.File,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.creatorService.createAlbum(
      request.user.sub,
      dto,
      picture,
      idempotencyKey,
    );
  }

  @Get('albums/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  getAlbum(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.creatorService.getAlbum(request.user.sub, id);
  }

  @Patch('albums/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  @UseInterceptors(
    FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  updateAlbum(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCreatorAlbumDto,
    @UploadedFile() picture?: Express.Multer.File,
  ) {
    return this.creatorService.updateAlbum(request.user.sub, id, dto, picture);
  }

  @Delete('albums/:id')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  deleteAlbum(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.creatorService.deleteAlbums(request.user.sub, [id]);
  }

  @Post('albums/bulk-delete')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  bulkDeleteAlbums(
    @Req() request: AuthenticatedRequest,
    @Body() dto: BulkDeleteCreatorReleasesDto,
  ) {
    return this.creatorService.deleteAlbums(request.user.sub, dto.ids);
  }

  @Put('albums/:albumId/composition')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  replaceComposition(
    @Req() request: AuthenticatedRequest,
    @Param('albumId', ParseIntPipe) albumId: number,
    @Body() dto: ReplaceCreatorAlbumCompositionDto,
  ) {
    return this.creatorService.replaceAlbumComposition(
      request.user.sub,
      albumId,
      dto.trackIds,
    );
  }

  @Put('albums/:albumId/tracks')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  assignAlbumTracks(
    @Req() request: AuthenticatedRequest,
    @Param('albumId', ParseIntPipe) albumId: number,
    @Body() dto: AssignCreatorAlbumTracksDto,
  ) {
    return this.creatorService.assignAlbumTracks(
      request.user.sub,
      albumId,
      dto.trackIds,
    );
  }

  @Post('albums/:albumId/tracks')
  @Permissions('creator.publish')
  @UseGuards(PermissionsGuard)
  assignAlbumTracksCompat(
    @Req() request: AuthenticatedRequest,
    @Param('albumId', ParseIntPipe) albumId: number,
    @Body() dto: AssignCreatorAlbumTracksDto,
  ) {
    return this.creatorService.assignAlbumTracks(
      request.user.sub,
      albumId,
      dto.trackIds,
    );
  }

  @Get('applications')
  @Permissions('creator.moderate')
  @UseGuards(PermissionsGuard)
  getApplications(@Query() query: CreatorApplicationsQueryDto) {
    return this.creatorService.getApplications(
      query.status,
      query.count,
      query.offset,
    );
  }

  @Patch('applications/:id/approve')
  @Permissions('creator.moderate')
  @UseGuards(PermissionsGuard)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.creatorService.approve(id, request.user.sub);
  }

  @Patch('applications/:id/reject')
  @Permissions('creator.moderate')
  @UseGuards(PermissionsGuard)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.creatorService.reject(id, request.user.sub, dto.reviewNote);
  }
}
