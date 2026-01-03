import Joi from "joi";

export const createNotificationSchema = Joi.object({
  user_id: Joi.string().required(),
  type: Joi.string().valid("info", "warning", "error", "success", "2FA").optional(),
  title: Joi.string().allow("").optional(),
  message: Joi.string().required(),
  metadata: Joi.object().optional(),
  createdAt: Joi.date().iso().optional(),
  expiresAt: Joi.date().iso().optional(),
});

export const listNotificationQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  lastId: Joi.string().optional(),
  appId: Joi.string().optional(),
  deviceId: Joi.string().optional(),
});

export const unreadCountQuery = Joi.object({
  appId: Joi.string().optional(),
  deviceId: Joi.string().optional(),
});

export const notificationIdParam = Joi.object({
  id: Joi.string().required(),
});

export const updateNotificationSchema = Joi.object({
  title: Joi.string().optional(),
  message: Joi.string().optional(),
  metadata: Joi.object().optional(),
  read: Joi.boolean().optional(),
  delivered: Joi.boolean().optional(),
  expiresAt: Joi.date().iso().optional(),
}).min(1);

export const updateReadSchema = Joi.object({
  read: Joi.boolean().required(),
});
