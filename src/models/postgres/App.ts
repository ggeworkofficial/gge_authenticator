// src/models/App.ts
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
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";

@Table({
  tableName: "apps",
  timestamps: true,
})
export class App extends Model<App> {

  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Unique
  @AllowNull(false)
  @Column({ type: DataType.STRING(100) })
  name!: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(150) })
  displayName!: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  description?: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  iconUrl?: string;

  @AllowNull(false)
  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive!: boolean;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt!: Date;
}
