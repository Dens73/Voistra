import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AccessChannelDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  password?: string;
}
