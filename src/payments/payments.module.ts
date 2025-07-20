import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PayPalClient } from '../config/paypal.config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentEntity } from './entities/payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 5000, maxRedirects: 5 }),
    TypeOrmModule.forFeature([PaymentEntity, SubscriptionEntity]),
  ],
  controllers: [PaymentsController],
  providers: [PayPalClient, PaymentsService],
})
export class PaymentsModule {}
