import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CollectionService } from './collection.service';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('collection')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest) {
    return this.collectionService.createForUser(request.user.sub);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  getAll(@Query() pagination: PaginationQueryDto) {
    return this.collectionService.getAll(pagination.count, pagination.offset);
  }

  @Get('user/:userId')
  getByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getByUserId(userId, request.user);
  }

  @Get('summary/:userId')
  getCollectionSummary(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCollectionSummary(userId, request.user);
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getOne(id, request.user);
  }

  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.delete(id, request.user);
  }
}
