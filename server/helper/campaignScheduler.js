import schedule from "node-schedule";
import { Resend } from "resend";
import Campaign from "../models/campaignModel.js";

export const loadScheduledCampaigns = async () => {
  const resend = new Resend("re_A1koj4d5_A8TuTo4WwA31se32tPr1J8nh");
  try {
    const campaigns = await Campaign.find({
      status: "pending",
      scheduledAt: { $gt: new Date() },
    });

    campaigns.forEach((campaign) => {
      schedule.scheduleJob(new Date(campaign.scheduledAt), async () => {
        try {
          const emailResponse = await resend.emails.send({
            from: "Campaign <anshulwadhwa.me>",
            to: campaign.recipients,
            subject: campaign.subject,
            text: campaign.content,
          });

          campaign.status = "sent";
          campaign.performance.emailsSent = campaign.recipients.length;
          campaign.performance.deliveryStatus = "completed";
          await campaign.save();
        } catch (error) {
          console.error(
            `Error sending campaign "${campaign.name}":`,
            error.message
          );
        }
      });
    });
  } catch (error) {
    console.error("Error loading scheduled campaigns:", error.message);
  }
};
