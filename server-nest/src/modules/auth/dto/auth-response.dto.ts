import { ApiProperty } from '@nestjs/swagger'

export class SessionUserDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty() email!: string
  @ApiProperty() companyId!: string
  @ApiProperty({ type: [String] }) permissions!: string[]
}

export class LoginDataDto {
  @ApiProperty() accessToken!: string
  @ApiProperty({ type: SessionUserDto }) user!: SessionUserDto
}

export class LoginResponseDto {
  @ApiProperty({ type: LoginDataDto }) data!: LoginDataDto
}

export class SessionDataDto {
  @ApiProperty({ type: SessionUserDto }) user!: SessionUserDto
}

export class SessionResponseDto {
  @ApiProperty({ type: SessionDataDto }) data!: SessionDataDto
}
