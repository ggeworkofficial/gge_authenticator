import { MainError } from "./main.error";

export class AppCreateError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}

export class AppFindError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 404, details);
    }
}

export class AppListError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}

export class AppUpdateError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}

export class AppDeleteError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}

export class AppUserCreateError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
    }
}

export class AppUserExistsError extends MainError {
    constructor(message: string, details?: any) {
        super(message, 409, details);
    }
}