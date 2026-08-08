import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedPrincipal } from 'src/rbac/rbac.constants';
import { RbacService } from 'src/rbac/rbac.service';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from 'src/user/model/user.model';

export interface AccessTokenPayload {
  sub: number;
  email: string;
  ver?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly rbacService: RbacService,
    @InjectModel(UserModel) private readonly userRepository: typeof UserModel,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedPrincipal> {
    const user = await this.userRepository.findByPk(payload.sub, {
      attributes: [
        'id',
        'accountStatus',
        'sessionVersion',
        'mustChangePassword',
      ],
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (user.accountStatus !== 'active')
      throw new ForbiddenException('Account is unavailable');
    if ((payload.ver ?? 0) !== user.sessionVersion)
      throw new UnauthorizedException('Session has been revoked');
    return this.rbacService.resolvePrincipal(payload.sub);
  }
}
