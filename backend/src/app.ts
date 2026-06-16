import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api", apiRoutes);
