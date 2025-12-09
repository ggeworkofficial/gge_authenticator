import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "../errors/validatoin.error";

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      throw new ValidationError("Invalid body schema", {
        errors: error.details.map((d) => d.message),
      });
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      throw new ValidationError("Invalid query parameters", {
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      throw new ValidationError("Invalid URL parameters", {
        errors: error.details.map((d) => d.message),
      });
    }
    next();
  };
};
