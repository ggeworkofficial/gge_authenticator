// src/models/LinkedAccount.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";

@Table({
  tableName: "linked_accounts",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["user_id", "provider"],
      name: "unique_user_provider",
    },
  ],
})
export class LinkedAccount extends Model<LinkedAccount> {

  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column({ type: DataType.STRING(50) })
  provider!: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(255) })
  providerUserId!: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  accessToken?: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  refreshToken?: string;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
