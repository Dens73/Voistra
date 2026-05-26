import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { ChannelType } from '../channel.entity';

export class CreateChannelDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @IsEnum(ChannelType)
  type!: ChannelType;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  password?: string;
}
