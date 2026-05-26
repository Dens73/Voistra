import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}
