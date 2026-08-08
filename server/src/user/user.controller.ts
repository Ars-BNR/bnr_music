import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AuthenticatedPrincipal } from 'src/rbac/rbac.constants';
import { ActivateDto } from './dto/check-link.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponse } from './response/user-response';
import { UserService } from './user.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponse } from './response/user-profile-response';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';

type AuthenticatedRequest = Request & {
  user: AuthenticatedPrincipal;
};

@ApiTags('Users')
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Register a user' })
  @ApiResponse({ status: 202 })
  registration(@Body() dto: CreateUserDto) {
    return this.userService.registration(dto);
  }

  @Post('activation/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  async resendActivation(@Body() dto: ResendActivationDto) {
    await this.userService.resendActivation(dto.email);
    return { success: true };
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

  @Post('password-reset/confirm')
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    await this.userService.confirmPasswordReset(dto.token, dto.password);
    return { success: true };
  }

  @Get('users/me')
  @ApiBearerAuth()
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    return this.userService.getProfile(request.user.sub);
  }

  @Patch('users/me')
  @ApiBearerAuth()
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    return this.userService.updateProfile(request.user.sub, dto);
  }

  @Post('users/me/avatar')
  @ApiBearerAuth()
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  replaceAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserProfileResponse> {
    return this.userService.replaceAvatar(request.user.sub, file);
  }

  @Delete('users/me/avatar')
  @ApiBearerAuth()
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  removeAvatar(
    @Req() request: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    return this.userService.removeAvatar(request.user.sub);
  }

  @Post('users/me/change-email')
  @ApiBearerAuth()
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
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
  @Permissions('profile.manage-own')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
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
    const clientUrl = this.config.getOrThrow<string>('CLIENT_URL');
    try {
      await this.userService.activate(params.link);
      return response.redirect(`${clientUrl}/login?activated=1`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return response.redirect(`${clientUrl}/login?activation=invalid`);
      }
      throw error;
    }
  }

  @Get('users')
  @ApiBearerAuth()
  @Permissions('users.read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  getAll() {
    return this.userService.getAllUsers();
  }
}
