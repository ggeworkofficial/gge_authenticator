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
