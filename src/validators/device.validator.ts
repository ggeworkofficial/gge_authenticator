import Joi from "joi";

export const commonCreateDeviceSchema = Joi.object({
  device_id: Joi.string().uuid().required(),
  device_name: Joi.string().required(),
  device_type: Joi.string().valid("browser", "mobile", "desktop").required(),
});

export const createDeviceSchema = commonCreateDeviceSchema.concat( Joi.object({
  user_id: Joi.string().uuid().required(),
}));

export const updateDeviceSchema = Joi.object({
  device_name: Joi.string(),
  device_type: Joi.string().valid("browser", "mobile", "desktop"),
  last_active_at: Joi.date().iso(),
}).min(1);

export const deviceIdParam = Joi.object({
  // Accept combined param in the form: <user_uuid>-<device_uuid>
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
    .required(),
});

export const deviceFilterSchema = Joi.object({
  device_id: Joi.string().uuid(),
  user_id: Joi.string().uuid(),
}).or("device_id", "user_id");
