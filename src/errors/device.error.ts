import { MainError } from "./main.error";

export class DeviceCreateError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class DeviceFindError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 404, details);
  }
}

export class DeviceListError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class DeviceUpdateError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class DeviceDeleteError extends MainError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}
