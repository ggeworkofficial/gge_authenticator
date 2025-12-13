import Joi from "joi";
import { commonCreateDeviceSchema } from "./device.validator";
import { createUserSchema } from "./user.validator";

export const tokenttl = Joi.object({
    accessTokenTtl: Joi.number().integer().min(60).max(86400).required(),
    refreshTokenttl: Joi.number().integer().min(60).max(7776000).required(),
});

export const registerSchema = Joi.object({
    app_id: Joi.string().uuid().required(),
    app_secret: Joi.string().optional()
})
.concat(createUserSchema)
.concat(commonCreateDeviceSchema)
.concat(tokenttl);

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(8).required(),
    app_id: Joi.string().uuid().required(),
    app_secret: Joi.string().optional()
})
.concat(commonCreateDeviceSchema)
.concat(tokenttl);

//check for accessTokenTtl's time validity
export const refreshSchema = Joi.object({
    refresh_token: Joi.string().required(),
    user_id: Joi.string().uuid().required(),
    device_id: Joi.string().uuid().required(),
    app_id: Joi.string().uuid().required(),
    accessTokenTtl: Joi.number().integer().min(60).max(86400).optional(),
});

//check for accessTokenTtl's time validity
export const authenticateSchema = Joi.object({
    access_token: Joi.string().required(),
    app_secret: Joi.string().min(8).required(),
    code_challanger: Joi.string().optional()
})
.concat(refreshSchema);

export const changePasswordSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    old_password_hash: Joi.string().min(8).required(),
    new_password_hash: Joi.string().min(8).required(),
});

export const verifiyEmailSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    otp: Joi.string().length(6).required(),
});

export const verifyCodeSchema = Joi.object({
    secret_key: Joi.string().required(),
    code_verifier: Joi.string().required(),
});