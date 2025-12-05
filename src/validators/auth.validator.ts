import Joi from "joi";
import { commonCreateDeviceSchema } from "./device.validator";
import { createUserSchema } from "./user.validator";

export const registerSchema = Joi.object({
    ... createUserSchema.describe().keys,
    ... commonCreateDeviceSchema.describe().keys,
    app_name: Joi.string().uuid().required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(8).required(),
    ... commonCreateDeviceSchema.describe().keys,
    app_id: Joi.string().uuid().required(),
});

export const refreshSchema = Joi.object({
    refresh_token: Joi.string().required(),
    device_id: Joi.string().uuid().required(),
    app_id: Joi.string().uuid().required(),
});

export const changePasswordSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    old_password_hash: Joi.string().min(8).required(),
    new_password_hash: Joi.string().min(8).required(),
});

export const verifiyEmailSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    otp: Joi.string().length(6).required(),
});