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
import { CartEntity } from './cart.entity';

@Entity('user_time_tracker')
export class UserTimeTrackerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  start_time: number;

  @Column({ type: 'varchar', nullable: true })
  end_time: number;

  @Column({ type: 'varchar', nullable: true })
  start_date: number;

  @Column({ type: 'varchar', nullable: true })
  end_date: number;

  @Column({ type: 'varchar', nullable: true })
  time_worked_so_far: string;

  @Column({ type: 'varchar', nullable: true })
  total_time: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user_id: UserEntity;

  @ManyToOne(() => BoardEntity, (board) => board.id)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board_id: BoardEntity;

  @ManyToOne(() => CartEntity, (cart) => cart.user_time_tracker)
  @JoinColumn({ name: 'cart_id', referencedColumnName: 'id' })
  cart_id: CartEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
