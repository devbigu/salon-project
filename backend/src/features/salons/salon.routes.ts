import { Router } from "express";
import {
  createSalon,
  getSalons,
} from "./salon.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("SUPER_ADMIN"), createSalon);
router.get("/", requireRole("SUPER_ADMIN"), getSalons);

export default router;
