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
import { AppointmentStatus } from '../../../common/enum/appointment-status.enum';
import { Availability } from 'src/app/availabilities/entities/availabilities.entity';

@Entity('appointments')
@Check(`
  status IN ('confirmada','cancelada')
`)
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Profile, (p) => p.appointments, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @Column({ name: 'availability_id', type: 'uuid' })
  availabilityId: string;

  @ManyToOne(() => Availability, (a) => a.appointments, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'availability_id' })
  availability: Availability;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.CONFIRMADA,
  })
  status: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
