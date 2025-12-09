import { MainError } from "./main.error";

export class ValidationError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}