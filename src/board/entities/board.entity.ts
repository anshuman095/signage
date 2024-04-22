import { UserEntity } from 'src/user/entities/user.entity';
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
import { BoardFlowEntity } from './board-flow.entity';

@Entity('board')
export class BoardEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  boardName: string;

  @Column({ type: 'varchar', nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  description: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'createdBy', referencedColumnName: 'id' })
  createdBy: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.boards, { cascade: true })
  @JoinTable({ name: 'board_users_board' })
  users: UserEntity[];

  @ManyToMany(() => BoardFlowEntity, (boardFlow) => boardFlow.board, {
    cascade: true,
  })
  @JoinTable({ name: 'board_flows_board' })
  flows: BoardFlowEntity[];

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'updatedBy', referencedColumnName: 'id' })
  updatedBy: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
