import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ApiErrorCode } from '../errors/api.exception'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const request = host.switchToHttp().getRequest<Request>()
    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      if (typeof body === 'object' && body !== null && 'error' in body) {
        response.status(exception.getStatus()).json(body)
        return
      }
      if (exception.getStatus() === 404) {
        response
          .status(404)
          .json({ error: { code: ApiErrorCode.NOT_FOUND, message: 'Recurso no encontrado.' } })
        return
      }
      if (exception.getStatus() === 400) {
        response.status(400).json({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'La información enviada no es válida.',
          },
        })
        return
      }
      response.status(exception.getStatus()).json({
        error: { code: ApiErrorCode.HTTP_ERROR, message: 'No se pudo procesar la solicitud.' },
      })
      return
    }
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    )
    response.status(500).json({
      error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Ocurrió un error inesperado.' },
    })
  }
}
