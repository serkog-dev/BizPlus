import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest()
    if (!user || !user.isAdmin) {
      throw new ForbiddenException('גישה מותרת למנהלי BizPlus בלבד')
    }
    return true
  }
}
