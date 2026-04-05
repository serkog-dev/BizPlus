import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'

/** Gets the current authenticated user from request */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)

/** Gets the current tenant ID from request */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user?.tenantId
  },
)

/** Role-based access control decorator */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

/** Mark route as public (no auth required) */
export const Public = () => SetMetadata('isPublic', true)
