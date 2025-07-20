import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'subscriptions', schema: 'umihiro' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  planName: string;

  @Column({ type: 'varchar', nullable: true })
  paypalSubscriptionId: string | null;

  @Column()
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextBillingTime: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
