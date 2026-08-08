import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
  CreateRoleDto,
  RbacIdDto,
  ReplaceUserRolesDto,
  SearchRbacUsersQueryDto,
  UpdateRoleDto,
} from './dto/rbac.dto';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { AuthenticatedPrincipal } from './rbac.constants';
import { RbacService } from './rbac.service';

type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

@Controller('rbac')
@Permissions('rbac.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('roles')
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Patch('roles/:id')
  updateRole(@Param() params: RbacIdDto, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(params.id, dto);
  }

  @Delete('roles/:id')
  deleteRole(@Param() params: RbacIdDto) {
    return this.rbacService.deleteRole(params.id);
  }

  @Get('users')
  getUsers(@Query() query: SearchRbacUsersQueryDto) {
    return this.rbacService.getUsers(query.query, query.count, query.offset);
  }

  @Put('users/:id/roles')
  replaceUserRoles(
    @Param() params: RbacIdDto,
    @Body() dto: ReplaceUserRolesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.rbacService.replaceUserRoles(
      params.id,
      dto.roleIds,
      request.user,
    );
  }
}
