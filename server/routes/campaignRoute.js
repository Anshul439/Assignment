import express from "express";
import {
  createCampaign,
  getCampaigns,
  sendCampaign,
  trackClick,
  trackEmailOpen,
} from "../controllers/campaignController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createCampaign);
router.get("/", authMiddleware, getCampaigns);
router.post("/send/:id", authMiddleware, sendCampaign);
router.get('/track-open', trackEmailOpen);
router.get("/track-click", trackClick);

export default router;
