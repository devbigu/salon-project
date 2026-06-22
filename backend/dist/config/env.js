import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDirectory, "../../.env") });
export const env = {
    PORT: process.env.PORT || "5000",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5175",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret",
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
};
