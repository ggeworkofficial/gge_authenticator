import { MainError } from "./main.error";

export class UserCreateError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class UserFindError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 404, details);
  }
}

export class UserListError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class UserUpdateError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class UserDeleteError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class UserPromotionError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = "UserPromotionError";
  }
}
