import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from './board.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Entity('user-board')
export class UserBoardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BoardEntity, (board) => board.id)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board_id: BoardEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user_id: UserEntity;

  @Column({ type: 'varchar', nullable: true, default: false })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true, default: false })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  board: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  user: number;

  @Column()
  expiry_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
