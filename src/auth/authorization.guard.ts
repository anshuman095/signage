import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from 'src/decorators/roles.decorators';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
        context.getClass(),
        context.getHandler(),
      ]);

      const userRole = request.user.role;

      if (!requiredRoles.includes(userRole)) {
        throw new Error('You are not authorized');
      }
      return true;
    } catch (err) {
      throw new ForbiddenException(
        err.message || 'session expired! Please sign In',
      );
    }
  }
}
