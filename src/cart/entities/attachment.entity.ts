import { UserEntity } from 'src/user/entities/user.entity';
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

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true, array: true })
  attachment_url: string[];

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'attach_by', referencedColumnName: 'id' })
  attach_by: UserEntity;

  @ManyToOne(() => CartEntity, (cart) => cart.attachments)
  @JoinColumn({ name: 'cart_id' })
  cart_id: CartEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
