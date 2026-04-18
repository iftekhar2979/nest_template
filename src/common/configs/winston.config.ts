import { WinstonModuleOptions } from "nest-winston";
import * as winston from "winston";

export const winstonLoggerConfig: WinstonModuleOptions = {
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.splat()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `[${timestamp}] ${level}: ${context ? "[" + context + "] " : ""}${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      ),
    }),
    new winston.transports.File({
      filename: `logs/${new Date().toISOString().split("T")[0].replace(/-/g, "/")}/application.log`,
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `[${timestamp}] ${level}: ${context ? "[" + context + "] " : ""}${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      ),
    }),
  ],
};
