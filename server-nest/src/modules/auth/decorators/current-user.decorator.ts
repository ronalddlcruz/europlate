import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from '../types/auth.types'

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
)
