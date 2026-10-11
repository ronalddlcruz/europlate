import type { SessionUser } from '../../modules/auth/types/auth.types.js'

export type AuthenticatedUser = SessionUser

declare global {
  // Express exposes Request through this global declaration namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { auth?: AuthenticatedUser }
  }
}
