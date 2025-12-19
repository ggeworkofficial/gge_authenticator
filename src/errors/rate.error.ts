import { MainError } from "./main.error";

export class ToManyRequestError extends MainError {
    constructor(message = "Refresh token not found", details?: any) {
        super(message, 429, details);
        this.name = "ToManyRequestError";
  }
}