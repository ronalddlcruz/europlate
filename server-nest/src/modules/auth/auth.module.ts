import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './controllers/auth.controller'
import { AuthRepository } from './repositories/auth.repository'
import { AuthService } from './services/auth.service'
import { TokenService } from './services/token.service'
import { JwtAccessGuard } from './guards/jwt-access.guard'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, TokenService, JwtAccessGuard],
  exports: [TokenService, JwtAccessGuard],
})
export class AuthModule {}
