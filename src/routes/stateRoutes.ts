import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getStates, getStateById, getStateByName } from "../controllers/stateController";

const router = Router();

// Protected routes
router.get("/", authMiddleware, getStates);
router.get("/:id", authMiddleware, getStateById);
router.get("/name/:name", authMiddleware, getStateByName);

export default router;
