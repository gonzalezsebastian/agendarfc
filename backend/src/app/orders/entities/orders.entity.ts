import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Check,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { ServiceTypeEnum } from '../../../common/enum/service-type.enum';
import { OrderStatus } from '../../../common/enum/order-status.enum';

@Entity('orders')
@Check(`status IN ('pendiente','pagado','rechazado')`)
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => Profile, (p) => p.id, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Profile | null;

  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ServiceTypeEnum,
  })
  serviceType: ServiceTypeEnum;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDIENTE,
  })
  status: OrderStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}
