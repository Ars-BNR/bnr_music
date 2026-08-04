import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { ActivateDto } from './dto/check-link.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponse } from './response/user-response';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  @Post('registration')
  @ApiOperation({ summary: 'Register a user' })
  @ApiResponse({ status: 201, type: UserResponse })
  async registration(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.userService.registration(dto);
    await this.userService.setRefreshTokenCookie(
      response,
      session.refreshToken,
    );
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('login')
  @Throttle({ default: { limit: 3, ttl: 50000 } })
  @ApiOperation({ summary: 'Log in' })
  @ApiResponse({ status: 200, type: UserResponse })
  async login(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.userService.login(dto);
    await this.userService.setRefreshTokenCookie(
      response,
      session.refreshToken,
    );
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.userService.logout(request.cookies?.refreshToken);
    this.userService.clearRefreshTokenCookie(response);
    return { success: true };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.userService.refresh(
      request.cookies?.refreshToken,
    );
    await this.userService.setRefreshTokenCookie(
      response,
      session.refreshToken,
    );
    return { accessToken: session.accessToken, user: session.user };
  }

  @Get('activate/:link')
  async activate(@Param() params: ActivateDto, @Res() response: Response) {
    await this.userService.activate(params.link);
    return response.redirect(this.config.getOrThrow<string>('CLIENT_URL'));
  }

  @Get('users')
  @ApiBearerAuth()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAll() {
    return this.userService.getAllUsers();
  }
}
