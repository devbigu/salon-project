import express , {type Request, type Response } from 'express';
import cors from "cors";
import cookiesParser from "cookie-parser";
import dotenv from "dotenv";
import { env } from "./config/env.js"
import authRoutes from "./routes/auth.routes.js";
import userRoutes from './routes/user.routes.js';
import salonRoutes from "./routes/salon.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import staffRoutes from "./routes/staff.routes.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cookiesParser());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

const PORT = env.PORT || 5000;

app.use(cors({
    origin: env.CLIENT_URL || "http://localhost:3000"
}))
app.use("/api/auth", authRoutes);
app.get("/", (req: Request, res: Response)=>{
    res.status(200).json({
        success: true,
        message: "Server is running"
    })
});
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/staff", staffRoutes);


app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.listen(PORT || 5000, () => {
  console.log(`Server running on port ${PORT}`);
});