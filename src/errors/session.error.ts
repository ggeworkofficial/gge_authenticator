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

export class SessionNotFoundError extends MainError {
  constructor(message = "Session not found", details?: any) {
    super(message, 404, details);
    this.name = "SessionNotFoundError";
  }
}

export class SessionListError extends MainError {
  constructor(message = "Failed to list sessions", details?: any) {
    super(message, 500, details);
    this.name = "SessionListError";
  }
}

export class SessionUpdateError extends MainError {
  constructor(message = "Failed to update session", details?: any) {
    super(message, 500, details);
    this.name = "SessionUpdateError";
  }
}

export class SessionDeleteError extends MainError {
  constructor(message = "Failed to delete session", details?: any) {
    super(message, 500, details);
    this.name = "SessionDeleteError";
  }
}
