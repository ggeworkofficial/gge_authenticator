// src/models/UserApp.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";
import { App } from "./App";

@Table({
  tableName: "user_apps",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["user_id", "app_id"],
      name: "unique_user_app",
    },
  ],
})
export class UserApp extends Model<UserApp> {

  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  user_id!: string;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  app_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => App)
  app!: App;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
