import { Router } from "express";
import {
  publicBookingCreateRateLimiter,
  publicBookingRateLimiter,
} from "../../middlewares/rate-limit.middleware.js";
import {
  getAvailableSlots,
  getPublicBranches,
  getPublicConfig,
  getPublicServices,
  postPublicAppointment,
} from "./public-booking.controller.js";

const router = Router();

router.use(publicBookingRateLimiter);
router.get("/:slug/config", getPublicConfig);
router.get("/:slug/branches", getPublicBranches);
router.get("/:slug/services", getPublicServices);
router.get("/:slug/available-slots", getAvailableSlots);
router.post(
  "/:slug/appointments",
  publicBookingCreateRateLimiter,
  postPublicAppointment
);

export default router;
