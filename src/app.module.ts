// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from './payments/payments.module';
import { PaymentEntity } from './payments/entities/payment.entity';
import { SubscriptionEntity } from './payments/entities/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('DB_HOST')!,
        port: Number(cs.get<string>('DB_PORT')!),
        username: cs.get<string>('DB_USER')!,
        password: cs.get<string>('DB_PASS')!,
        database: cs.get<string>('DB_NAME')!,
        entities: [PaymentEntity, SubscriptionEntity],
        synchronize: true,
        logging: true,
      }),
    }),
    PaymentsModule,
  ],
})
export class AppModule {}
