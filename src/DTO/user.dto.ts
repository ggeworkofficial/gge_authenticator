import { User } from "../models/postgres/User";


export interface PublicUserDTO {
  id: string;
  username?: string;
  avatar_url?: string;
}

export interface UserSelfDTO {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: Date;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: Date;
  is_admin: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UserMapper {
  static toPublic(user: User): PublicUserDTO {
    return {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
    };
  }

  static toSelf(user: User): UserSelfDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatar_url: user.avatar_url,
      date_of_birth: user.date_of_birth,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  static toAdmin(user: User): AdminUserDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatar_url: user.avatar_url,
      date_of_birth: user.date_of_birth,
      is_admin: user.is_admin,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  static toPublicList(users: User[]): PublicUserDTO[] {
    return users.map(this.toPublic);
  }

  static toSelfList(users: User[]): UserSelfDTO[] {
    return users.map(this.toSelf);
  }

  static toAdminList(users: User[]): AdminUserDTO[] {
    return users.map(this.toAdmin);
  }
}