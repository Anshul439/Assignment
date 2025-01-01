import Campaign from "../models/campaignModel.js";
import { Resend } from "resend";
import schedule from "node-schedule";

const resend = new Resend("re_A1koj4d5_A8TuTo4WwA31se32tPr1J8nh");

export const createCampaign = async (req, res) => {
  try {
    const { name, description, recipients, subject, content, scheduledAt } =
      req.body;

    const existingCampaign = await Campaign.findOne({ name });
    if (existingCampaign) {
      return res
        .status(400)
        .json({ message: "A campaign with this name already exists." });
    }

    let dateIST = null;
    if (scheduledAt) {
      const rawDate = new Date(scheduledAt);
      dateIST = new Date(
        rawDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
    }

    const campaign = new Campaign({
      name,
      description,
      recipients,
      subject,
      content,
      scheduledAt: dateIST,
    });
    await campaign.save();

    if (dateIST) {
      console.log("Scheduled At (raw):", scheduledAt);
      console.log("Scheduled At (IST):", dateIST);

      if (dateIST > new Date()) {
        schedule.scheduleJob(dateIST, async () => {
          console.log("Triggering email sending for campaign:", campaign.name);
          await sendEmails(campaign);
        });
      } else {
        return res
          .status(400)
          .json({ message: "Scheduled time must be in the future." });
      }
    } else {
      console.log("Sending emails immediately for campaign:", campaign.name);
      await sendEmails(campaign);
    }

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendCampaign = async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    await sendEmails(campaign);

    res.json({ message: "Bulk emails sent successfully", campaign });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const NGROK_URL = "https://5d7f-2401-4900-1c2b-e599-49c0-3620-3c25-5380.ngrok-free.app";

const sendEmails = async (campaign) => {
  try {
    const timestamp = Date.now();
    const trackingPixelUrl = `${NGROK_URL}/api/campaigns/track-open?campaignId=${campaign._id}&t=${timestamp}`;
    
    // We'll embed the tracking pixel in a more Gmail-friendly way
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0;">
          <!-- Main content first to ensure it displays properly -->
          <div style="margin-bottom: 15px;">
            ${campaign.content}
          </div>

          <!-- Call to action -->
          <div style="margin-bottom: 15px;">
            Click here to learn more: 
            <a href="${NGROK_URL}/api/campaigns/track-click?campaignId=${campaign._id}&url=${encodeURIComponent("https://example.com")}"
               style="color: #0366d6; text-decoration: underline;">
              Visit Link
            </a>
          </div>

          <!-- Hidden container for tracking pixel -->
          <div style="display:none">
            <img src="${trackingPixelUrl}"
                 alt=""
                 width="1"
                 height="1"
                 style="display:none !important;"
            />
            <!-- Backup tracking method using background image -->
            <div style="background-image:url(${trackingPixelUrl}&m=2);width:1px;height:1px;">
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending email with tracking URL:", trackingPixelUrl);

    const emailResponse = await resend.emails.send({
      from: "Campaign <noreply@anshulwadhwa.me>",
      to: campaign.recipients,
      subject: campaign.subject,
      html: emailContent,
      headers: {
        "List-Unsubscribe": `<${trackingPixelUrl}&m=unsub>`,  // Adding this can help deliverability
        "X-Entity-Ref-ID": campaign._id.toString(),
      }
    });

    campaign.status = "sent";
    campaign.performance.emailsSent = campaign.recipients.length;
    campaign.performance.deliveryStatus = "completed";
    await campaign.save();

    console.log("Email sent with response:", emailResponse);
  } catch (error) {
    console.error("Error sending emails:", error);
    campaign.performance.deliveryStatus = "failed";
    await campaign.save();
  }
};

export const trackEmailOpen = async (req, res) => {
  console.log('\n=== Email Open Tracking ===');
  console.log('Time:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  
  const { campaignId } = req.query;
  
  if (!campaignId) {
    console.log('No campaignId provided');
    return sendTrackingPixel(res);
  }
  
  try {
    const result = await Campaign.findOneAndUpdate(
      { _id: campaignId },
      { 
        $inc: { 'performance.openRate': 1 },
        $set: { 
          'performance.lastOpened': new Date(),
          'performance.lastOpenedDetails': {
            userAgent: req.headers['user-agent'],
            ip: req.ip
          }
        }
      },
      { new: true, upsert: false }
    );
    
    console.log('Campaign update result:', result ? 'Success' : 'Not Found');
    
    sendTrackingPixel(res);
    
  } catch (error) {
    console.error('Tracking error:', error);
    sendTrackingPixel(res);
  }
};

// Helper function to send tracking pixel
const sendTrackingPixel = (res) => {
  const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': transparentGif.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString()
  });
  
  res.send(transparentGif);
};


export const trackClick = async (req, res) => {
  try {
    const { campaignId, url } = req.query;

    if (!campaignId || !url) {
      return res.status(400).json({ message: "Missing campaignId or URL" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Increment the click rate
    campaign.performance.clickRate += 1;
    await campaign.save();

    // Redirect to the target URL
    res.redirect(decodeURIComponent(url));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
