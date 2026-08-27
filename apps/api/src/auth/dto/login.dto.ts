import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length } from 'class-validator'

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string
  @IsString()
  @Length(15, 128)
  password!: string
}
