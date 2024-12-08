import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({
    example: 1,
    description: 'id пользователя',
  })
  @IsInt({ message: 'Должно быть строкой' })
  userId: number;
}
