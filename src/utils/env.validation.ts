import * as Joi from "joi";

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "PROD")
    .default("development"),
  PORT: Joi.number().default(8080),

  DB_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  EXPIRES_IN: Joi.string().default("30d"),

  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),

  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_IP: Joi.string().optional(),

  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_SECRET_NAME: Joi.string().required(),
  AWS_PUBLIC_BUCKET_NAME: Joi.string().required(),

  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().required(),
  ADMIN_ROLE: Joi.string().required(),
  ADMIN_NAME: Joi.string().required(),
  ADMIN_PROFILE_PICTURE: Joi.string().required(),
  ADMIN_PHONE: Joi.string().required(),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),

  FR_BASE_URL: Joi.string().optional(),
});
