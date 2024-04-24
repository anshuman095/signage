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
import { CartEntity } from './cart.entity';

@Entity('cart_checklist')
export class CartChecklistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  checklist_title: string;

  @Column({ type: 'varchar', nullable: true, default: false })
  checklist_status: boolean;

  @ManyToOne(() => CartEntity, (user) => user.id)
  @JoinColumn({ name: 'cart_id', referencedColumnName: 'id' })
  cart_id: CartEntity;

  @ManyToMany(() => UserEntity, (user) => user.checklist_members, {
    cascade: true,
  })
  @JoinTable({ name: 'cart_checklist_users' })
  checklist_users: UserEntity[];

  @ManyToMany(() => CartEntity, (cart) => cart.checklists)
  cart: CartEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
