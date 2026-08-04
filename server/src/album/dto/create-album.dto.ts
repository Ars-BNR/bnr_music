import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ example: "Assassin's Creed II" })
  @IsString()
  name: string;

  @ApiProperty({ example: 'image/ac2.jpg' })
  @IsString()
  picture: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId: number;
}
