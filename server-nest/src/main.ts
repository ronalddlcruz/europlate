import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureHttpApp } from './config/application/configure-http-app'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const port = config.getOrThrow<number>('NEST_PORT')
  const webOrigin = config.get<string>('WEB_ORIGIN')
  configureHttpApp(app, webOrigin)
  app.enableShutdownHooks()
  await app.listen(port, '0.0.0.0')
  console.info(
    `Europlate Nest Auth: http://localhost:${port}/api/auth · Swagger: http://localhost:${port}/docs`,
  )
}

void bootstrap()
