import Joi from "joi";

export const createAppSchema = Joi.object({
  name: Joi.string().max(100).required(),
  display_name: Joi.string().max(150).required(),
  hashed_secret: Joi.string().min(8).required(),
  description: Joi.string().allow(null, ""),
  icon_url: Joi.string().uri().allow(null, ""),
  is_active: Joi.boolean().default(true),
});

export const updateAppSchema = Joi.object({
  name: Joi.string().max(100),
  display_name: Joi.string().max(150),
  description: Joi.string(),
  icon_url: Joi.string().uri(),
  is_active: Joi.boolean(),
}).min(1);

export const appsFilterQuerySchema = Joi.object({
  user_id: Joi.string().uuid(),
  device_id: Joi.string().uuid(),
  app_id: Joi.string().uuid(),
});

export const createUserAppSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  app_id: Joi.string().uuid().required(),
});

export const appIdParam = Joi.object({
  id: Joi.string().uuid(),
  name: Joi.string().max(100),
}).xor("id", "name");

export const changeAppsSecretSchema = Joi.object({
  id: Joi.string().uuid().required(),
  old_hashed_secret: Joi.string().min(8).required(),
  new_hashed_secret: Joi.string().min(8).required(),
});