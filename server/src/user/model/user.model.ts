import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { CollectionModel } from 'src/collection/model/collection.model';
import { TokenModel } from 'src/token/model/token.model';

@Table({ tableName: 'users', timestamps: false })
export class UserModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({ example: 'Misha@mail.ru', description: 'Email пользователя' })
  @Unique
  @Column(DataType.STRING)
  email: string;

  @ApiProperty({
    example: 'Third Street Saint',
    description: 'Public display name',
  })
  @AllowNull(false)
  @Default('')
  @Column(DataType.STRING(80))
  displayName: string;

  @ApiProperty({ example: 'Собираю редкие саундтреки.', required: false })
  @AllowNull(false)
  @Default('')
  @Column(DataType.STRING(280))
  bio: string;

  @ApiProperty({ example: 'image/avatar.png', required: false })
  @AllowNull
  @Column(DataType.STRING)
  avatar: string | null;

  @ApiProperty({ example: 'Miha6318', description: 'Пароль пользователя' })
  @Column(DataType.STRING)
  password: string;

  @ApiProperty({ example: 'user', description: 'Роль пользователя' })
  @Default('user')
  @Column(DataType.STRING)
  role: string;

  @ApiProperty({ example: 'false', description: 'Активирован ли пользователь' })
  @Default(false)
  @Column(DataType.BOOLEAN)
  isActivated: boolean;

  @ApiProperty({
    example: 'jhfdhbg12f',
    description: 'Ссылка на активацию аккаунта',
  })
  @Column(DataType.STRING)
  activationLink: string;

  @HasMany(() => TokenModel)
  tokens: TokenModel[];

  @HasOne(() => CollectionModel)
  collection: CollectionModel;
}
