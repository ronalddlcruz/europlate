import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl, type DatabasePoolMode } from '../../config/database/database-url'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: resolveDatabaseUrl(
            config.getOrThrow<string>('SUPABASE_DATABASE_URL'),
            config.get<DatabasePoolMode>('NEST_DATABASE_POOL_MODE') ?? 'session',
            config.get<number>('NEST_DATABASE_CONNECTION_LIMIT') ?? 5,
          ),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
