import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('subscriptions')
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.svc.createSubscription(dto);
  }
}
