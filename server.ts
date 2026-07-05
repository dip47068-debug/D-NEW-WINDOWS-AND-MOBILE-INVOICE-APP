import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// In-Memory storage for PDFs to share on WhatsApp
const pdfStore = new Map<string, { buffer: Buffer; fileName: string; timestamp: number }>();

// In-Memory store for active mobile OTPs
const otpStore = new Map<string, { otp: string; timestamp: number }>();

// Lazy-loaded Gemini AI client to prevent startup crashes when API key is not yet configured
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it via Settings > Secrets.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Clean up expired PDFs and OTPs periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of pdfStore.entries()) {
    if (now - item.timestamp > 1000 * 60 * 60 * 2) { // 2 hour TTL
      pdfStore.delete(id);
    }
  }
  for (const [mobile, item] of otpStore.entries()) {
    if (now - item.timestamp > 1000 * 60 * 10) { // 10 min TTL
      otpStore.delete(mobile);
    }
  }
}, 1000 * 60 * 10);

// --- API ENDPOINTS ---

// SMS OTP Sending endpoint
app.post("/api/auth/otp/send", (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ success: false, error: "Invalid 10-digit mobile number." });
    }

    // Generate random 4-digit code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(mobile, { otp, timestamp: Date.now() });

    console.log(`[SMS Gateway] Sent OTP ${otp} to +91 ${mobile}`);

    // Return the generated OTP in the API response so the simulator can display it directly,
    // plus a confirmation message.
    return res.json({
      success: true,
      message: `SMS Sent successfully to +91 ${mobile} via virtual gateway.`,
      otp: otp // Exposed for seamless testing & simulation
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PDF Invoice Upload (from client jsPDF output)
app.post("/api/invoices/upload-pdf", (req, res) => {
  try {
    const { pdfData, invoiceNumber } = req.body;
    if (!pdfData) {
      return res.status(400).json({ success: false, error: "Missing PDF binary data." });
    }

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const buffer = Buffer.from(pdfData, "base64");
    const fileName = `${invoiceNumber || "Invoice"}_${Date.now()}.pdf`;

    pdfStore.set(uniqueId, {
      buffer,
      fileName,
      timestamp: Date.now()
    });

    return res.json({
      success: true,
      pdfUrl: `/pdf/${uniqueId}`,
      message: "PDF uploaded successfully to hosted gateway."
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Public hosted PDF serving endpoint
app.get("/pdf/:id", (req, res) => {
  const item = pdfStore.get(req.params.id);
  if (!item) {
    return res.status(404).send(
      `<html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f1f5f9;">
          <h2 style="color: #ef4444;">PDF Invoice Link Expired</h2>
          <p style="color: #64748b;">The PDF sharing link is invalid or has expired (2-hour limit). Please regenerate the link in your invoice panel.</p>
        </body>
      </html>`
    );
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${item.fileName}"`);
  return res.send(item.buffer);
});

// Gemini AI endpoint
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { action, prompt, context } = req.body;
    const ai = getGeminiClient();

    if (action === "expand-description") {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a professional description (under 150 characters) for an Indian Tax Invoice of this product or service: "${prompt}". Focus on commercial terms, models, specification details or technical specs, suitable for a professional invoice item detail. Keep it extremely brief, direct, and without marketing buzzwords. No introductory text. Just the description.`,
      });
      return res.json({ text: response.text?.trim() });
    }

    if (action === "parse-invoice") {
      const schema = {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, description: "Name of the customer or business if mentioned" },
          mobile: { type: Type.STRING, description: "10-digit mobile number if mentioned" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING, description: "Specific product name or service description" },
                quantity: { type: Type.NUMBER, description: "Quantity of the product" },
                rate: { type: Type.NUMBER, description: "Unit rate or price per item" },
                hsnCode: { type: Type.STRING, description: "HSN code if mentioned, otherwise leave empty" },
                description: { type: Type.STRING, description: "Any extra specs, color, or model details if mentioned" }
              },
              required: ["productName", "quantity", "rate"]
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the user's plain text prompt requesting an invoice or item additions: "${prompt}". Parse it into a structured invoice object containing customer details and item lists. Strictly match the specified JSON schema. Prompt: "${prompt}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      return res.json({ text: response.text?.trim() });
    }

    if (action === "sales-trends-restocking") {
      const schema = {
        type: Type.OBJECT,
        properties: {
          trendsSummary: { type: Type.STRING, description: "Detailed analysis of sales trends, fast/slow moving items, and peak periods" },
          predictions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING, description: "Unique ID of the product" },
                productName: { type: Type.STRING, description: "Name of the product" },
                currentStock: { type: Type.NUMBER, description: "Current stock quantity in store" },
                predictedMonthlyDemand: { type: Type.NUMBER, description: "Expected monthly demand based on past invoice trends" },
                restockDate: { type: Type.STRING, description: "Predicted date or timeline for restocking (e.g. 'Within 5 days', 'Immediate', 'Safe for 30 days')" },
                recommendedQuantity: { type: Type.NUMBER, description: "Ideal reorder quantity" },
                priority: { type: Type.STRING, description: "Restocking priority level: 'High', 'Medium', or 'Low'" },
                reason: { type: Type.STRING, description: "Specific business or mathematical justification for this prediction" }
              },
              required: ["productId", "productName", "currentStock", "predictedMonthlyDemand", "restockDate", "recommendedQuantity", "priority", "reason"]
            }
          },
          additionalInsights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of actionable insights/strategies to optimize inventory holding cost and maximize sales"
          }
        },
        required: ["trendsSummary", "predictions", "additionalInsights"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the provided sales invoices and current products inventory data to determine sales trends and predict inventory restocking requirements.
Invoices Data: ${JSON.stringify(context?.invoices || [])}
Products Data: ${JSON.stringify(context?.products || [])}
Current local simulation date is 2026-06-11.
Strictly match the specified JSON schema and output only the parsed JSON string.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      return res.json({ text: response.text?.trim() });
    }

    if (action === "chat") {
      const systemInstruction = `You are a helpful GST business assistant for our invoicing and billing application "D BILLIFY". 
You have access to the business's current state: ${JSON.stringify(context || {})}.
Answer user questions regarding their sales performance, invoices, ledger, products, taxes, or general GST regulations.
Give extremely brief, actionable, and mathematically correct answers. 
Suggest strategies to increase revenue or handle outstanding bills.`;

      // Use history if provided, otherwise fallback to single prompt
      let chatContents = req.body.history || prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
        }
      });

      return res.json({ text: response.text?.trim() });
    }

    return res.status(400).json({ error: "Unsupported AI action requested." });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ error: err.message || "An error occurred with the Gemini AI service." });
  }
});

// Email Database Backup Endpoint
app.post("/api/backup/email", async (req, res) => {
  try {
    const { backupData, backupEmail, smtpSettings } = req.body;
    
    if (!backupData) {
      return res.status(400).json({ success: false, error: "No backup data provided." });
    }
    
    const emailToUse = backupEmail || "dip47068@gmail.com";
    
    // Create nodemailer transporter if custom SMTP details are present
    let transporter = null;
    if (
      smtpSettings && 
      smtpSettings.smtpHost && 
      smtpSettings.smtpUser && 
      smtpSettings.smtpPass
    ) {
      transporter = nodemailer.createTransport({
        host: smtpSettings.smtpHost,
        port: Number(smtpSettings.smtpPort) || 587,
        secure: smtpSettings.smtpSecure || false,
        auth: {
          user: smtpSettings.smtpUser,
          pass: smtpSettings.smtpPass
        }
      });
    }

    const backupJsonString = typeof backupData === "string" ? backupData : JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `dbillify_backup_${dateStr}.json`;

    if (transporter) {
      const mailOptions = {
        from: smtpSettings.smtpUser,
        to: emailToUse,
        subject: `D Billify Database Backup [${dateStr}]`,
        text: `Hello,\n\nPlease find attached the automated database backup file for the D Billify Invoicing System.\n\nBackup Date: ${new Date().toLocaleString()}\nFile Name: ${filename}\n\nYou can upload and restore this backup file at any time in Company Setup > Settings > Database & Backups.\n\nBest regards,\nYour Invoicing System Backup Service`,
        attachments: [
          {
            filename,
            content: backupJsonString,
            contentType: "application/json"
          }
        ]
      };
      
      await transporter.sendMail(mailOptions);
      return res.json({
        success: true,
        message: `Backup emailed successfully to ${emailToUse}!`,
        mode: "smtp"
      });
    } else {
      console.log(`[Virtual Mail Gateway] Sending backup to ${emailToUse}. Details: Size ${backupJsonString.length} bytes.`);
      return res.json({
        success: true,
        message: `Backup Simulated & Auto-Saved to local storage! (Virtual dispatch sent to ${emailToUse}). To use a real email inbox, configure your SMTP server details in Settings.`,
        mode: "simulated",
        backupFilename: filename,
        contentPreview: backupJsonString.substring(0, 300) + "..."
      });
    }
  } catch (err: any) {
    console.error("Backup Email Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to send backup email." });
  }
});

// Serve Vite dev server or static distribution files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting on port ${PORT}`);
  });
}

startServer();
