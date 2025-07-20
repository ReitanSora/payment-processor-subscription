import { IsUUID, IsString, IsEmail } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsString()
  planName: string;

  @IsEmail()
  subscriberEmail: string;
}
