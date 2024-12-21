import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TrackService } from './track.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateTrackDto } from './dto/create-track.dto';
import { searchDto } from './dto/search-dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)
@Controller('/tracks')
export class TrackController {
  constructor(private trackService: TrackService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'picture', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ]),
  )
  create(@UploadedFiles() files, @Body() dto: CreateTrackDto) {
    const { picture, audio } = files;
    return this.trackService.create(dto, picture[0], audio[0]);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.trackService.getAll(count, offset);
  }

  @Get('/popular')
  getTopTracks(@Query('count') count: number, @Query('offset') offset: number) {
    return this.trackService.getTopTracks(count, offset);
  }

  @Post('/listen/:id')
  listen(@Param('id') id: number) {
    return this.trackService.listen(id);
  }

  @Get('/search')
  search(@Query() dto: searchDto) {
    console.log(dto);
    return this.trackService.search(dto.query);
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.trackService.getOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.trackService.delete(id);
  }

  @Patch('change/:id')
  change(@Param('id') id: number, @Body() updateData: UpdateTrackDto) {
    return this.trackService.change(id, updateData);
  }
}
