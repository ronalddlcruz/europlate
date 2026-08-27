export type AuthenticatedUser = { id: string; companyId: string; permissions: string[] }

declare global {
  namespace Express {
    interface Request { auth?: AuthenticatedUser }
  }
}
