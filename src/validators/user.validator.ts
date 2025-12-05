import Joi from "joi";

export const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password_hash: Joi.string().min(8).required(),
    username: Joi.string().min(3).max(120).required(),
    phone: Joi.string().min(10).max(15).optional(),
    avatar_url: Joi.string().uri().optional(),
    date_of_birth: Joi.date().iso().required(),
    is_admin: Joi.boolean().default(false),
    is_verified: Joi.boolean().default(false),
});

export const updateUserSchema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(120),
    phone: Joi.string().min(10).max(15),
    avatar_url: Joi.string().uri(),
    date_of_birth: Joi.date().iso(),
    is_admin: Joi.boolean(),
    is_verified: Joi.boolean(),
}).min(1);

export const userIdParam = Joi.object({
    id: Joi.string().uuid().required(),
});
