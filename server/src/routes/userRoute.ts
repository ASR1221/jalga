import { Router } from "express";
import { register, signIn } from "../controllers/userController";
import { checkAndRecreateSession, createSession } from "../middlewares/tokenGeneration";

const router = Router();

router.post("/user/register", register as any, createSession as any);

router.post("/user/signIn", checkAndRecreateSession as any, signIn as any);

export default router;