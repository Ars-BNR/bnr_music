import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserModel } from './model/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto, UserJWTData } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { Response } from 'express';
import { TokenService } from 'src/token/token.service';
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel) private userRepository: typeof UserModel,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    try {
      return bcrypt.hash(password, 10);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async findUserByEmail(email: string): Promise<UserModel> {
    try {
      return this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateAndSaveTokens(userDTO: UserJWTData) {
    try {
      const tokens = await this.tokenService.generateTokens(userDTO);
      await this.tokenService.saveToken(userDTO.id, tokens.refreshToken);
      return { ...tokens, user: userDTO };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async setRefreshTokenCookie(res: Response, refreshToken: string) {
    try {
      res.cookie('refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async registration(dto: CreateUserDto) {
    try {
      const candidate = await this.findUserByEmail(dto.email);
      if (candidate) {
        throw new HttpException(
          'Пользователь уже существует',
          HttpStatus.BAD_REQUEST,
        );
      }
      const hashPassword = await this.hashPassword(dto.password);
      const activationLink = uuid.v4();
      const user = await this.userRepository.create({
        email: dto.email,
        password: hashPassword,
        activationLink,
      });

      await this.mailService.sendActivationMail(
        dto.email,
        `${process.env.API_URL}/activate/${activationLink}`,
      );

      const userDto = new UserJWTData(user);
      return this.generateAndSaveTokens(userDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async activate(activationLink: string) {
    try {
      console.log('activationLink', activationLink);
      const user = await UserModel.findOne({ where: { activationLink } });
      if (!user) {
        throw new HttpException(
          'Некорректная ссылка активации',
          HttpStatus.BAD_REQUEST,
        );
      }
      user.isActivated = true;
      await user.save();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(dto: CreateUserDto) {
    try {
      const user = await this.findUserByEmail(dto.email);
      if (!user) {
        throw new HttpException(
          'Пользователь не найден',
          HttpStatus.BAD_REQUEST,
        );
      }
      const isPassEqual = await bcrypt.compare(dto.password, user.password);
      if (!isPassEqual) {
        throw new HttpException('Неверный пароль', HttpStatus.BAD_REQUEST);
      }
      const userDto = new UserJWTData(user);
      return this.generateAndSaveTokens(userDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(refreshToken: string): Promise<Number> {
    try {
      const token = await this.tokenService.removeToken(refreshToken);
      return token;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refresh(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new HttpException(
          'Пользователь не авторизован',
          HttpStatus.BAD_REQUEST,
        );
      }
      const userData =
        await this.tokenService.validateRefreshToken(refreshToken);
      const tokenFromDB = await this.tokenService.findToken(refreshToken);
      if (!userData || !tokenFromDB) {
        throw new HttpException(
          'Пользователь не авторизован',
          HttpStatus.BAD_REQUEST,
        );
      }
      const user = await this.userRepository.findOne({
        where: {
          id: userData.user.id,
        },
      });
      if (!user) {
        throw new HttpException(
          'Ошибка при создании пользователя',
          HttpStatus.BAD_REQUEST,
        );
      }
      const userDto = new UserJWTData(user);
      return this.generateAndSaveTokens(userDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllUsers() {
    try {
      const users = await this.userRepository.findAll({
        // include: { all: true },
      });
      return users;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
