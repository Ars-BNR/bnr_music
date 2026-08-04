import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { LoginDto } from './dto/login.dto';
import { UserResponse } from './response/user-response';
import { UserService } from './user.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponse } from './response/user-profile-response';

type AuthenticatedRequest = Request & {
  user: { sub: number; email: string; role: string };
};

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
    @Body() dto: LoginDto,
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

  @Get('users/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    return this.userService.getProfile(request.user.sub);
  }

  @Patch('users/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    return this.userService.updateProfile(request.user.sub, dto);
  }

  @Post('users/me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  replaceAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserProfileResponse> {
    return this.userService.replaceAvatar(request.user.sub, file);
  }

  @Delete('users/me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  removeAvatar(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    return this.userService.removeAvatar(request.user.sub);
  }

  @Post('users/me/change-email')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changeEmail(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangeEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.userService.changeEmail(request.user.sub, dto);
    this.userService.clearRefreshTokenCookie(response);
    return { success: true };
  }

  @Post('users/me/change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.userService.changePassword(request.user.sub, dto);
    this.userService.clearRefreshTokenCookie(response);
    return { success: true };
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
