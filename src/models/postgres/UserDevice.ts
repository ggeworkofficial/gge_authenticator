// src/models/UserDevice.ts
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
  tableName: "user_devices",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["user_id", "device_id"],
      name: "unique_user_device",
    },
  ],
})
export class UserDevice extends Model<UserDevice> {

  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  device_name?: string;

  @AllowNull(false)
  @Default("browser")
  @Column({ type: DataType.STRING(255) })
  device_type!: string;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  device_id!: string;

  @AllowNull(true)
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE })
  last_active_at?: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
