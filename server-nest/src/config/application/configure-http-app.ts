import { ValidationPipe, type INestApplication } from '@nestjs/common'
import helmet from 'helmet'
import { ApiErrorCode, ApiException } from '../../common/errors/api.exception'
import { ApiExceptionFilter } from '../../common/filters/api-exception.filter'
import { setupSwagger } from '../swagger/swagger.config'

export function configureHttpApp(app: INestApplication, webOrigin?: string): void {
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
  app.use(helmet())
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => callback(null, !origin || localOrigin.test(origin) || origin === webOrigin),
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const first = errors[0]
        const issue = first ? Object.values(first.constraints ?? {})[0] : undefined
        const field = first?.property ? ` en ${first.property}` : ''
        return new ApiException(
          ApiErrorCode.VALIDATION_ERROR,
          issue ? `Revisa el campo${field}: ${issue}` : 'La información enviada no es válida.',
          422,
        )
      },
    }),
  )
  app.useGlobalFilters(new ApiExceptionFilter())
  setupSwagger(app)
}
