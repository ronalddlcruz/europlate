import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Europlate API — migración Nest')
    .setDescription('Autenticación Nest en paralelo. La aplicación web continúa usando Express.')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { displayRequestDuration: true, persistAuthorization: true },
  })
}
