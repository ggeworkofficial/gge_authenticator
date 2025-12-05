import Joi from "joi";

export const createAppSchema = Joi.object({
  name: Joi.string().max(100).required(),
  display_name: Joi.string().max(150).required(),
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

// Query filter
export const appsFilterQuerySchema = Joi.object({
  user_id: Joi.string().uuid(),
  device_id: Joi.string().uuid(),
}).or("user_id", "device_id");

// App ID param
export const appIdParam = Joi.object({
  id: Joi.string().uuid(),
  name: Joi.string().max(100),
}).xor("id", "name");
