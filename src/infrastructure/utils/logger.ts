import winston from "winston";

export const logger = winston.createLogger({
	level: "info",
	format: winston.format.simple(),
	transports: [
		new winston.transports.File({ filename: "error.log", level: "error" }),
		new winston.transports.File({ filename: "combined.log", level: "info" }),
	],
});
