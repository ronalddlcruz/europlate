import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CurrentUser } from '../decorators/current-user.decorator'
import { LoginResponseDto, SessionResponseDto } from '../dto/auth-response.dto'
import { LoginDto } from '../dto/login.dto'
import { JwtAccessGuard } from '../guards/jwt-access.guard'
import { AuthService } from '../services/auth.service'
import type { SessionUser } from '../types/auth.types'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(@Body() input: LoginDto) {
    return { data: await this.auth.login(input) }
  }

  @Get('session')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la sesión y los permisos vigentes' })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida o vencida' })
  session(@CurrentUser() user: SessionUser) {
    return { data: { user } }
  }
}
