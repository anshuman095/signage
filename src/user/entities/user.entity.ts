import * as bcrypt from 'bcrypt';
import { BoardFlowEntity } from 'src/board/entities/board-flow.entity';
import { BoardEntity } from 'src/board/entities/board.entity';
import { CartChecklistEntity } from 'src/cart/entities/cart-checklist.entity';
import { CartEntity } from 'src/cart/entities/cart.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// export enum StatusUser {
//   INACTIVE = "INACTIVE",
//   PENDING = "PENDING",
//   ACTIVE = "ACTIVE",
// }

export enum TaskStatus {
  TODO = 'TODO',
  COMPLETED = 'COMPLETED',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  fName: string;

  @Column({ type: 'varchar', length: 30 })
  lName: string;

  @Column({ type: 'varchar', unique: true, length: 30, nullable: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isEmailVerified: boolean;

  // @Column({
  //   type: "enum",
  //   nullable: true,
  //   default: StatusUser.INACTIVE,
  //   enum: StatusUser,
  // })
  // status: StatusUser;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'enum', nullable: true, enum: Role, default: Role.USER })
  role: Role;

  @Column({
    type: 'enum',
    nullable: true,
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  task_status: TaskStatus;

  @ManyToMany(() => BoardEntity, (board) => board.users)
  boards: BoardEntity;

  @ManyToMany(() => CartEntity, (cart) => cart.members)
  cart_members: CartEntity[];

  @ManyToMany(
    () => CartChecklistEntity,
    (cartChecklist) => cartChecklist.checklist_users,
  )
  checklist_members: CartChecklistEntity;

  @ManyToMany(() => BoardFlowEntity, (boardFlow) => boardFlow.users)
  flows: BoardFlowEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  async hashPassword() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
}
