import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {register, login, me, refresh, logout} from "./auth.controller.js"

const router = Router();


router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

router.use(authenticate);

router.get("/me", me);
router.post("/logout", logout);



export default router;
