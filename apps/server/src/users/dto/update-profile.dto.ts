import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string | null;

  @IsOptional()
  @IsBoolean()
  reconnectEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushToTalkEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceActivationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  noiseSuppressionEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  echoCancellationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoGainControlEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword?: string;
}
