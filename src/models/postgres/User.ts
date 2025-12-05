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
  dateOfBirth?: Date;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "is_admin" })
  isAdmin!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "is_verified" })
  isVerified!: boolean;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt!: Date;
}
