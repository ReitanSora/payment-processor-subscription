import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as paypal from '@paypal/checkout-server-sdk';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PayPalClient } from '../config/paypal.config';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentEntity } from './entities/payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paypalBase: string;
  private readonly usersUrl: string;
  private readonly invoicesUrl: string;

  constructor(
    private paypalClient: PayPalClient,
    private http: HttpService,
    private config: ConfigService,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepo: Repository<SubscriptionEntity>,
  ) {
    this.paypalBase =
      this.config.get('PAYPAL_MODE') === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    this.usersUrl = this.config.get<string>(
      'USERS_MANAGEMENT_UPDATE_PLAN_URL',
    )!;
    this.invoicesUrl = this.config.get<string>('INVOICES_SERVICE_URL')!;
  }

  // — Create a recurring SUBSCRIPTION —
  async createSubscription(dto: CreateSubscriptionDto) {
    if (dto.planName.toUpperCase() === 'NONE') {
      const freeSub = this.subscriptionRepo.create({
        userId: dto.userId,
        planName: dto.planName,
        paypalSubscriptionId: null,
        status: 'ACTIVE',
        nextBillingTime: null,
      });
      return this.subscriptionRepo.save(freeSub);
    }
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID')!;
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET')!;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    // 1) Obtén un token OAuth2
    const tokenResp = await lastValueFrom(
      this.http.post<{ access_token: string }>(
        `${this.paypalBase}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    const accessToken = tokenResp.data.access_token;

    const planEnv = `PAYPAL_PLAN_${dto.planName.toUpperCase()}`;
    const planId = this.config.get<string>(planEnv);
    if (!planId)
      throw new NotFoundException(`Plan ${dto.planName} no configurado`);
    const body = {
      plan_id: planId,
      subscriber: { email_address: dto.subscriberEmail },
      application_context: {
        brand_name: 'Umihiro',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${this.config.get('PAYMENT_SERVICE_COMPLETE_URL')}/payments/subscriptions/complete`,
        cancel_url: `${this.config.get('PAYMENT_SERVICE_CANCEL_URL')}/payments/subscriptions/cancel`,
      },
    };
    const subResp = await lastValueFrom(
      this.http.post<any>(`${this.paypalBase}/v1/billing/subscriptions`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    // 3) Persiste en DB
    const result = subResp.data;
    const sub = this.subscriptionRepo.create({
      userId: dto.userId,
      planName: dto.planName,
      paypalSubscriptionId: result.id,
      status: result.status,
      nextBillingTime: result.billing_info?.next_billing_time
        ? new Date(result.billing_info.next_billing_time)
        : null,
    });
    await this.subscriptionRepo.save(sub);

    // 4) Devuelve al cliente el enlace de aprobación
    const approveLink = result.links.find((l) => l.rel === 'approve')?.href;
    return { subscriptionId: result.id, status: result.status, approveLink };
  }
}
