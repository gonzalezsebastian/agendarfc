// src/modules/profiles/entities/profile.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Availability } from 'src/app/availabilities/entities/availabilities.entity';
import { Appointment } from 'src/app/appointments/entities/appointment.entity';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  username: string;

  @Column({ name: 'role', type: 'text' })
  role: string;

  @ManyToOne(() => Role, (r) => r.profiles, { eager: true })
  @JoinColumn({ name: 'role', referencedColumnName: 'description' })
  roleRef: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'text', default: '' })
  phone: string;

  @Column({ type: 'text' })
  email: string;

  @OneToMany(() => Availability, (a) => a.player)
  availabilities: Availability[];

  @OneToMany(() => Appointment, (a) => a.user)
  appointments: Appointment[];
}
