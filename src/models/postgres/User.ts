// src/models/User.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  Unique,
  AllowNull,
  IsEmail,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";

@Table({
  tableName: "users",
  timestamps: true,
})
export class User extends Model<User> {

  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column({ type: DataType.STRING })
  email!: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  username?: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  password_hash?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  phone?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  avatar_url?: string;

  @AllowNull(true)
  @Column({ type: DataType.DATEONLY, field: "date_of_birth" })
  date_of_birth?: Date;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "is_admin" })
  is_admin!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "is_super_admin" })
  isSuperAdmin!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "is_verified" })
  is_verified!: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE})
  updated_at!: Date;
}
