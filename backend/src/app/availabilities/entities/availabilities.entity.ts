import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  Check,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { AvailabilityStatus } from '../../../common/enum/availability-status.enum';

@Entity('availabilities')
@Check(`
  status IN ('disponible','reservado','cancelado')
`)
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'player_id', type: 'uuid', nullable: true })
  playerId: string | null;

  @ManyToOne(() => Profile, (p) => p.availabilities, { nullable: true })
  @JoinColumn({ name: 'player_id' })
  player: Profile | null;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.DISPONIBLE,
  })
  status: AvailabilityStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @OneToMany(() => Appointment, (ap) => ap.availability)
  appointments: Appointment[];
}
