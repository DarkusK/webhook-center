import { Transform } from 'class-transformer'
import { IsString, Length } from 'class-validator'

export class CreateEndpointDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  name!: string
}
