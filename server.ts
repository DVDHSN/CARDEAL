import express from "express";
import { createServer as createViteServer } from "vite";
import * as path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { mode, url, data, model } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY1 environment variable is not set." });
      }
      
      if (apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI")) {
        return res.status(500).json({ error: "Your Gemini API key is set to a placeholder value ('MY_GEMINI_API_KEY'). Please open your AI Studio Settings -> App Secrets, and DELETE the GEMINI_API_KEY secret, or provide a real one. The app will use the free system key automatically once you delete it." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const selectedModel = model === 'flash-lite' ? 'gemini-3.1-flash-lite-preview' : 'gemini-flash-latest';

      const isUrlMode = mode === 'url';
      
      let actualPrompt = '';
      if (isUrlMode) {
        actualPrompt = `
        You are an expert car appraiser and mechanic. The user wants you to analyze a used car listing at the following URL: ${url}
        You MUST use your Google Search tools to find details, price (can be a range), mileage (can be a range), condition, reviews, and market value of the car in the listing.
        Synthesize the data and provide an evaluation.
        `;
      } else {
        actualPrompt = `
        You are an expert car appraiser and mechanic. Analyze the following used car listing data and provide an evaluation.
        The price and mileage might be provided as ranges (e.g. RM 50000 - 60000 or 50k - 60k).
        Data: ${JSON.stringify(data)}
        `;
      }

      const reqConfig: any = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Deal score from 0 to 100" },
            dealRating: { type: Type.STRING, description: "GREAT DEAL, FAIR DEAL, GOOD DEAL, BAD DEAL, etc." },
            askingPrice: { type: Type.STRING, description: "Formats as $X,XXX or RM X,XXX - Y,XXX" },
            estimatedMarketValue: { type: Type.STRING, description: "Formats as $X,XXX or RM X,XXX - Y,XXX" },
            marketComparison: { type: Type.STRING, description: "e.g. $2,400 BELOW MARKET VALUE" },
            marketComparisonColor: { type: Type.STRING, description: "success, warning, or error" },
            factors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "e.g. PRICE VS MARKET" },
                  score: { type: Type.INTEGER, description: "Score from 0 to 100" },
                  rating: { type: Type.STRING, description: "GOOD, NEUTRAL, BAD" },
                  color: { type: Type.STRING, description: "success, warning, or error" },
                  description: { type: Type.STRING }
                }
              }
            },
            redFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            greenFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            negotiationPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            verdict: { type: Type.STRING }
          },
          required: ["score", "dealRating", "askingPrice", "estimatedMarketValue", "marketComparison", "marketComparisonColor", "factors", "redFlags", "greenFlags", "negotiationPoints", "verdict"]
        }
      };

      if (isUrlMode) {
        reqConfig.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: actualPrompt,
        config: reqConfig
      });
      
      const resultObj = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: resultObj });
    } catch(err: any) {
        const errStr = err?.message || String(err);
        console.error("Analysis error:", errStr);
        let errorMsg = "Failed to analyze car data. Please try again.";
        
        if (errStr.includes("API key not valid") || errStr.includes("API_KEY_INVALID")) {
          errorMsg = "Your Gemini API Key saved in AI Studio Settings is invalid. Please open Settings -> App Secrets in the side panel, and DELETE your GEMINI_API_KEY secret. The app will automatically use the free system key once it is deleted.";
        } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
          errorMsg = "Your API Key has exceeded its usage quota. Please try again later or check your billing at Google AI Studio.";
        } else if (errStr.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
          errorMsg = "Your Gemini API Key does not have permission to perform Google Search. Because scraping failed, we attempted to use Google Search but were rejected due to insufficient API key scopes.";
        }
        
        return res.status(500).json({ error: errorMsg });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
