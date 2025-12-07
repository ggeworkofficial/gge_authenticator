import { MainError } from "./main.error";

export class UserNotFoundError extends MainError {
  constructor(message = "User not found", details?: any) {
    super(message, 404, details);
  }
}

export class IncorrectPasswordError extends MainError {
  constructor(message = "Incorrect credentials", details?: any) {
    super(message, 401, details);
  }
}

export class AuthError extends MainError {
  constructor(message = "Authentication error", details?: any) {
    super(message, 400, details);
  }
}

export class PasswordChangeError extends MainError {
  constructor(message = "Failed to change password", details?: any) {
    super(message, 500, details);
    this.name = "PasswordChangeError";
  }
}

export class PasswordMatchError extends MainError {
  constructor(message = "Old password does not match", details?: any) {
    super(message, 401, details);
    this.name = "PasswordMismatchError";
  }
}
