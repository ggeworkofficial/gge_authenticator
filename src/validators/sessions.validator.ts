import Joi from "joi";

export const createSessionSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    device_id: Joi.string().uuid().required(),
    app_id: Joi.string().uuid().required(),
    client_type: Joi.string().valid("browser", "mobile", "desktop").required(),
    access_token: Joi.string().required(),
    refresh_token: Joi.string().required(),
    accessTokenExpiresAt: Joi.date().iso().required(),
    refreshTokenExpiresAt: Joi.date().iso().required(),
});

export const updateSessionSchema = Joi.object({
    device_id: Joi.string().uuid(),
    appId: Joi.string().uuid(),
    access_token: Joi.string(),
    refresh_token: Joi.string(),
    accessTokenExpiresAt: Joi.date().iso(),
    refreshTokenExpiresAt: Joi.date().iso(),
}).min(1);

export const sessionIdParam = Joi.object({
    user_id: Joi.string().uuid(),
    id: Joi.string().uuid(),
}).xor("id", "user_id");

// Filter
export const sessionFilterSchema = Joi.object({
    session_id: Joi.string().uuid(),
    user_id: Joi.string().uuid(),
    app_id: Joi.string().uuid(),
    device_id: Joi.string().uuid(),
}).min(1);
