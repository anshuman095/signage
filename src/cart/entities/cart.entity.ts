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
import { LabelEntity } from './label.entity';
import { BoardEntity } from 'src/board/entities/board.entity';

@Entity('cart')
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cart_title: string;

  @Column({ type: 'varchar', nullable: true })
  cart_description: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  created_by: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updated_by: UserEntity;

  @ManyToOne(() => BoardEntity, (board) => board.id)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board_id: BoardEntity;

  @ManyToMany(() => UserEntity, (user) => user.cart_members, {
    cascade: true,
  })
  @JoinTable({ name: 'cart_users' })
  members: UserEntity[];

  @ManyToOne(() => LabelEntity, (label) => label.id)
  @JoinColumn({ name: 'label_id', referencedColumnName: 'id' })
  label_id: LabelEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
