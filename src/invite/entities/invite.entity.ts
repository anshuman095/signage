import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from 'src/board/entities/board.entity';
import { UserEntity } from 'src/user/entities/user.entity';

export enum Status {
  PENDING = 'PENDING',
  CONFIRM = 'CONFIRM',
}

@Entity('invite')
export class InviteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BoardEntity, (board) => board.id)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board_id: BoardEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user_id: UserEntity;

  @Column({ type: 'varchar', length: 30, nullable: true })
  user_email: string;

  @Column({
    type: 'enum',
    nullable: true,
    enum: Status,
    default: Status.PENDING,
  })
  status: Status;

  @Column({ type: 'varchar', nullable: true, default: false })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  invitation_url: string;

  @Column()
  expiry_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
