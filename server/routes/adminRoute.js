import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {login} from "../controllers/adminController.js"

const router = express.Router();

router.post("/login", login);

export default router;
