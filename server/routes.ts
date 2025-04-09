import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
import fetch from "node-fetch";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const leadFormSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(10),
  storeName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  message: z.string().optional().or(z.literal(""))
});

router.post("/api/lead", async (req, res) => {
  try {
    const webhookUrl = "https://discord.com/api/webhooks/1350725470781440050/Q4et3O6OUh4cjq2a7UwZo0z6P6qJXSw52mkfAL_AOHtXArjUXM5Cseqtzx6pRGh-P5wh";
    const data = leadFormSchema.parse(req.body);

    const webhookBody = {
      embeds: [{
        title: "Novo Lead Recebido! 🎉",
        color: 0x1E65DE,
        fields: [
          { name: "Nome", value: data.name, inline: true },
          { name: "WhatsApp", value: data.whatsapp, inline: true },
          { name: "Loja", value: data.storeName, inline: true },
          { name: "Email", value: data.email || "Não informado", inline: true },
          { name: "Cidade", value: data.city || "Não informada", inline: true },
          { name: "Mensagem", value: data.message || "Não informada" }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody)
    });

    if (!response.ok) {
      throw new Error('Failed to send to Discord');
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Failed to process lead" });
  }
});

export default router;

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for lead form submission
  app.post("/api/leads", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertLeadSchema.parse(req.body);

      // Add timestamp
      const lead = {
        ...validatedData,
        createdAt: new Date().toISOString(),
      };

      // Store the lead
      const createdLead = await storage.createLead(lead);

      res.status(201).json({
        message: "Lead submitted successfully",
        lead: createdLead
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({ 
          message: "Failed to submit lead information" 
        });
      }
    }
  });

  app.use(router); // Use the new router

  const httpServer = createServer(app);

  return httpServer;
}