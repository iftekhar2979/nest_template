import * as Joi from "joi";

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "PROD")
    .default("development"),
  PORT: Joi.number().default(8080),

  DB_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  EXPIRES_IN: Joi.string().default("30d"),

  SMTP_USERNAME: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),

  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_IP: Joi.string().optional(),

  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_SECRET_NAME: Joi.string().optional(),
  AWS_PUBLIC_BUCKET_NAME: Joi.string().optional(),

  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),

  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().optional(),
  ADMIN_ROLE: Joi.string().optional(),
  ADMIN_NAME: Joi.string().optional(),
  ADMIN_PROFILE_PICTURE: Joi.string().optional(),
  ADMIN_PHONE: Joi.string().optional(),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),

  FR_BASE_URL: Joi.string().optional(),
});
