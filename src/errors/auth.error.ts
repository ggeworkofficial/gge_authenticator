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

export class AccessTokenError extends MainError {
    constructor(message = "Access token error", details?: any) {
        super(message, 400, details);
        this.name = "AccessTokenError";
    }
}

export class AccessTokenExpiredError extends MainError {
  constructor(message = "Access token expired", details?: any) {
    super(message, 401, details);
    this.name = "AccessTokenExpiredError";
  }
}

export class RefreshTokenExpiredError extends MainError {
  constructor(message = "Refresh token expired", details?: any) {
    super(message, 401, details);
    this.name = "RefreshTokenExpiredError";
  }
}

export class RefreshTokenNotFoundError extends MainError {
  constructor(message = "Refresh token not found", details?: any) {
    super(message, 404, details);
    this.name = "RefreshTokenNotFoundError";
  }
}

export class RefreshTokenReplayError extends MainError {
  constructor(message = "Refresh token not found", details?: any) {
    super(message, 404, details);
    this.name = "RefreshTokenNotFoundError";
  }
}

export class RefreshTokenError extends MainError {
    constructor(message = "Refresh token not found", details?: any) {
        super(message, 404, details);
        this.name = "RefreshTokenNotFoundError";
  }
}

export class NotAdminError extends MainError {
  constructor(message = "User is not an admin", details?: any) {
    super(message, 403, details);
    this.name = "NotAdminError";
  }
}
