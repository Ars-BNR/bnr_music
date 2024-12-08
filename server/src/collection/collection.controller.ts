import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('collection')
export class CollectionController {
    constructor(private collectionService: CollectionService) {}

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionService.create(dto);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.collectionService.getAll(count, offset);
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.collectionService.getOne(id);
  }

  @Delete("delete/:id")
  delete(@Param("id") id:number){
    return this.collectionService.delete(id)
  }

  @Patch("change/:id")
  change(@Param("id") id:number,@Body() updateData:CreateCollectionDto){
    return this.collectionService.change(id,updateData)
  }
}
