import { MainError } from "./main.error";

export class SessionCreateError extends MainError {
  constructor(message = "Failed to create session", details?: any) {
    super(message, 500, details);
    this.name = "SessionCreateError";
  }
}

export class SessionValidationError extends MainError {
  constructor(message = "Invalid session data", details?: any) {
    super(message, 400, details);
    this.name = "SessionValidationError";
  }
}
