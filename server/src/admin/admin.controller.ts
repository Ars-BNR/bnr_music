import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AuthenticatedPrincipal } from 'src/rbac/rbac.constants';
import { AdminUsersQueryDto } from './dto/admin-users.dto';
import { AdminService } from './admin.service';

@Controller('admin/users')
@Permissions('users.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get() list(@Query() query: AdminUsersQueryDto) {
    return this.admin.list(
      query.query,
      query.status,
      query.count,
      query.offset,
    );
  }
  @Post(':id/password-reset') reset(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedPrincipal },
  ) {
    return this.admin.resetPassword(req.user.sub, Number(id));
  }
  @Patch(':id/block') block(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedPrincipal },
  ) {
    return this.admin.setStatus(req.user.sub, Number(id), 'blocked');
  }
  @Patch(':id/unblock') unblock(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedPrincipal },
  ) {
    return this.admin.setStatus(req.user.sub, Number(id), 'active');
  }
  @Patch(':id/restore') restore(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedPrincipal },
  ) {
    return this.admin.setStatus(req.user.sub, Number(id), 'active');
  }
  @Delete(':id') remove(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedPrincipal },
  ) {
    return this.admin.setStatus(req.user.sub, Number(id), 'deleted');
  }
}
