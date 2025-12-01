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
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(true)
  @Column({ type: DataType.STRING(255) })
  deviceName?: string;

  @AllowNull(false)
  @Default("browser")
  @Column({ type: DataType.STRING(255) })
  deviceType!: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(255) })
  deviceId!: string;

  @AllowNull(true)
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE })
  lastActiveAt?: Date;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt!: Date;
}
