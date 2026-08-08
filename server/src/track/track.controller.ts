import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { CreateTrackDto } from './dto/create-track.dto';
import { searchDto } from './dto/search-dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { TrackService } from './track.service';
import { RecordPlayDto } from './dto/record-play.dto';

@Controller('tracks')
export class TrackController {
  constructor(private readonly trackService: TrackService) {}

  @Post()
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'picture', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ]),
  )
  create(
    @UploadedFiles()
    files: { picture?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Body() dto: CreateTrackDto,
  ) {
    return this.trackService.create(
      dto,
      files?.picture?.[0],
      files?.audio?.[0],
    );
  }

  @Get()
  getAll(@Query() pagination: PaginationQueryDto) {
    return this.trackService.getAll(pagination.count, pagination.offset);
  }

  @Get('popular')
  getTopTracks(@Query() pagination: PaginationQueryDto) {
    return this.trackService.getTopTracks(pagination.count, pagination.offset);
  }

  @Post('listen/:id')
  listen(@Param('id', ParseIntPipe) id: number) {
    return this.trackService.listen(id);
  }

  @Post(':id/plays')
  recordPlay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPlayDto,
  ) {
    return this.trackService.recordPlay(id, dto.playbackId);
  }

  @Get('search')
  search(@Query() dto: searchDto) {
    return this.trackService.search(dto.query, dto.page, dto.limit);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.trackService.getOne(id);
  }

  @Delete(':id')
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.trackService.delete(id);
  }

  @Patch('change/:id')
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  change(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateTrackDto,
  ) {
    return this.trackService.change(id, updateData);
  }
}
