import { HttpException } from '@nestjs/common'

export enum ApiErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_SESSION = 'INVALID_SESSION',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  HTTP_ERROR = 'HTTP_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class ApiException extends HttpException {
  constructor(code: ApiErrorCode, message: string, status: number) {
    super({ error: { code, message } }, status)
  }
}
