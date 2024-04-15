import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  fName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  lName: string;

  @Column({ type: 'varchar', unique: true, length: 20, nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'enum', nullable: true, enum: Role })
  role: Role;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
