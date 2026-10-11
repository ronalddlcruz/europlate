import type { ConfigModuleOptions } from '@nestjs/config'
import { validateEnvironment } from './environment/environment.validation'

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  envFilePath: ['.env', 'prisma/.env'],
  validate: validateEnvironment,
}
