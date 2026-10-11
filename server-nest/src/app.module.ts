import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './common/prisma/prisma.module'
import { configModuleOptions } from './config/config-module.options'
import { FEATURE_MODULES } from './modules'

@Module({ imports: [ConfigModule.forRoot(configModuleOptions), PrismaModule, ...FEATURE_MODULES] })
export class AppModule {}
