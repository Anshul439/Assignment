import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { connectDB } from "./config/db.js";
import adminRoute from "./routes/adminRoute.js";
import campaignRoute from "./routes/campaignRoute.js";
import { loadScheduledCampaigns } from "./helper/campaignScheduler.js";

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json());

app.use("/api/admin", adminRoute);
app.use("/api/campaigns", campaignRoute);

loadScheduledCampaigns();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
