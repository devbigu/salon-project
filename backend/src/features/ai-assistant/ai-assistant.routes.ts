import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { chat } from "./ai-assistant.controller.js";

const router = Router();

router.use(authenticate);
router.post("/chat", chat);

export default router;
