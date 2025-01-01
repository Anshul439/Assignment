import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  recipients: [{ type: String, required: true }],
  subject: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ["scheduled", "sent", "failed"], default: "scheduled" },
  scheduleTime: { type: Date },
  performance: {
    emailsSent: { type: Number, default: 0 },
    deliveryStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
  },
}, { timestamps: true });

export default mongoose.model("Campaign", campaignSchema);
