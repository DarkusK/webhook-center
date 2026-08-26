import { IsEmail, IsString, Length } from 'class-validator'
import { Transform } from 'class-transformer'

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string
  @IsString()
  @Length(15, 128)
  password!: string
}
