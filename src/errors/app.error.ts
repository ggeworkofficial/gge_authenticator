import { MainError } from "./main.error";

export class AppCreateError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}