import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from './board.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Entity('board-flow')
export class BoardFlowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BoardEntity, (board) => board.id)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board_id: BoardEntity;

  @Column({ type: 'varchar', nullable: true })
  flow_name: string;

  @Column({ type: 'varchar', nullable: true })
  index: number;

  @ManyToMany(() => BoardEntity, (board) => board.flows)
  board: BoardEntity;

  @ManyToMany(() => UserEntity, (user) => user.flows, { cascade: true })
  @JoinTable({ name: 'board_flow_users' })
  users: UserEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
