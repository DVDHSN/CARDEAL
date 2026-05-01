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
      const { data, model } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not set." });
      }
      
      if (process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY.includes("MY_GEMINI")) {
        return res.status(500).json({ error: "Your Gemini API key is set to a placeholder value ('MY_GEMINI_API_KEY'). Please open your AI Studio Settings -> App Secrets, and DELETE the GEMINI_API_KEY secret, or provide a real one. The app will use the free system key automatically once you delete it." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const selectedModel = model === 'flash-lite' ? 'gemini-3.1-flash-lite-preview' : 'gemini-flash-latest';

      const prompt = `
      You are an expert car appraiser and mechanic. Analyze the following used car listing data and provide an evaluation.
      Data: ${JSON.stringify(data)}
      `;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Deal score from 0 to 100" },
              dealRating: { type: Type.STRING, description: "GREAT DEAL, FAIR DEAL, GOOD DEAL, BAD DEAL, etc." },
              askingPrice: { type: Type.STRING, description: "Formats as $X,XXX" },
              estimatedMarketValue: { type: Type.STRING, description: "Formats as $X,XXX" },
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
        }
      });
      
      const resultObj = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: resultObj });
    } catch(err: any) {
        console.error("Analysis error:", err.message);
        let errorMsg = "Failed to analyze car data.";
        if (err.message && (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID"))) {
          errorMsg = "Your Gemini API Key is missing or invalid. If you are in AI Studio, please ensure it is correctly configured in your settings. If running locally, check .env.";
        }
        return res.status(500).json({ error: errorMsg });
    }
  });

  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Basic browser-like headers to reduce 403 Forbidden likelihood
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Focus primarily on extracting basic details for AI evaluation
      const title = $("title").text().trim();
      const metaDescription = $('meta[name="description"]').attr("content") || "";

      let price = "";
      let mileage = "";
      let rawText = "";

      // carlist.my basic heuristics (classes and dom elements often change)
      if (url.includes("carlist.my")) {
        price = $('[data-type="price"]').first().text().trim() || $('.price').first().text().trim() || $('meta[property="product:price:amount"]').attr('content') || "";
        mileage = $('[data-type="mileage"]').first().text().trim() || $('.mileage').first().text().trim() || "";
      }

      // Cleanup large DOM elements that ruin extraction before taking text
      $('script, style, noscript, iframe, img, svg, link, header, footer, nav').remove();
      rawText = $('body').text().replace(/\s+/g, ' ').trim();

      return res.json({
        success: true,
        data: {
          title,
          description: metaDescription,
          price,
          mileage,
          rawText: rawText.substring(0, 8000), // Prevent sending overly massive payload
        }
      });
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      
      const status = error.response?.status || 500;
      
      // Specifically handle 403 and 500 as requested
      if (status === 403) {
        return res.status(403).json({ 
          error: "Access to the site was forbidden (403). The website is actively blocking automated scraping requests." 
        });
      } else if (status >= 500) {
        return res.status(500).json({ 
          error: `The target server encountered an error (${status}). Please try again later.` 
        });
      }

      return res.status(status).json({ 
        error: `Failed to scrape the URL. (${error.message})` 
      });
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
