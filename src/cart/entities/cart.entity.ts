import { UserEntity } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LabelEntity } from './label.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { CartChecklistEntity } from './cart-checklist.entity';
import { UserTimeTrackerEntity } from './user-time-tracker.entity';
import { CommentEntity } from './comment.entity';
import { AttachmentEntity } from './attachment.entity';
import { BoardFlowEntity } from 'src/board/entities/board-flow.entity';

@Entity('cart')
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cart_title: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
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

  @ManyToMany(
    () => CartChecklistEntity,
    (cartCheckList) => cartCheckList.cart,
    {
      cascade: true,
    },
  )
  @JoinTable({ name: 'cart_checklists_cart' })
  checklists: CartChecklistEntity[];

  @OneToMany(() => LabelEntity, (label) => label.cart_id)
  labels: LabelEntity[];

  @OneToMany(
    () => UserTimeTrackerEntity,
    (userTimeTracker) => userTimeTracker.cart_id,
  )
  user_time_tracker: UserTimeTrackerEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.cart_id)
  comments: CommentEntity[];

  @OneToMany(() => AttachmentEntity, (attachments) => attachments.cart_id)
  attachments: AttachmentEntity[];

  @ManyToOne(() => BoardFlowEntity, (boardFlow) => boardFlow.id)
  @JoinColumn({ name: 'flow_id', referencedColumnName: 'id' })
  boardFlow: BoardFlowEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
