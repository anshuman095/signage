import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartEntity } from './cart.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Entity('comment')
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  comment_message: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'commented_by' })
  commented_by: UserEntity;

  @ManyToOne(() => CartEntity, (cart) => cart.comments)
  @JoinColumn({ name: 'cart_id' })
  cart_id: CartEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
