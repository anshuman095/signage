import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity('label')
export class LabelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  label_name: string;

  @Column({ type: 'varchar', nullable: true })
  color_code: string;

  @ManyToOne(() => CartEntity, (cart) => cart.labels)
  cart_id: CartEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
