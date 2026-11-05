import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JWT_SECRET } from './auth.constants';
import { verifyJwt } from './auth.crypto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || request.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Bearer authorization format');
    }

    try {
      const payload = verifyJwt<JwtPayload>(token, JWT_SECRET);
      request.user = payload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Token is invalid or expired');
    }
  }
}
