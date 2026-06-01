/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { RealitySyncData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CACHE_KEY = 'nexus_reality_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedData {
  timestamp: number;
  data: RealitySyncData;
}

const FALLBACK_DATA: RealitySyncData = {
  globalPressure: 642.8,
  viscosity: 0.38,
  turbulence: 0.45,
  temperature: 0.52,
  stability: 76,
  pipingIntegrity: 0.88,
  reservoirDensity: 0.62,
  reasoning: "Synthetic stream active. Orchestrating multi-layered reality simulation based on historical volatility clusters.",
  events: [
    {
      title: "QUOT_LIM_REACHED",
      theme: "ALGO",
      intensity: "HIGH",
      impact: "TURBULENCE",
      description: "Reality Sync API quota exhausted. Using high-fidelity synthetic data.",
      analysis: "Multiple high-frequency API requests triggered a protective rate-limit layer in the neural core.",
      consequences: "System is now operating on localized simulation models, reducing sync cost while maintaining structural fidelity."
    },
    {
      title: "NEURAL_SCALING_PEAK",
      theme: "ALGO",
      intensity: "HIGH",
      impact: "TEMPERATURE",
      description: "Massive compute clusters synchronized. Neural density reaching limits.",
      analysis: "Global GPU networks have reached a peak synchronous state, causing a spike in algorithmic heat dispersion.",
      consequences: "Expect increased transaction speeds but higher computational overhead across all decentralized nodes."
    },
    {
      title: "LIQUIDITY_INJECTION",
      theme: "ABYSSAL",
      intensity: "MEDIUM",
      impact: "PRESSURE",
      description: "Centralized reserves detected. Flow rates stabilizing in the lower strata.",
      analysis: "Capital is flooding from traditional banking silos into high-viscosity digital reservoirs.",
      consequences: "Upward pressure on asset values as the floor level of the abyssal ecosystem rises."
    },
    {
      title: "KINETIC_INTERFERENCE",
      theme: "FRICTION",
      intensity: "HIGH",
      impact: "TURBULENCE",
      description: "Geopolitical friction points detected at the simulation boundary.",
      analysis: "Trade tensions between major tech superpowers are creating 'ripples' in the supply chain data stream.",
      consequences: "Localized volatility spikes likely; hardware-backed assets may see significant price turbulence."
    },
    {
      title: "QUANTUM_REBALANCING",
      theme: "QUANTUM",
      intensity: "LOW",
      impact: "TEMPERATURE",
      description: "DeFi protocols executing automated liquidity migrations.",
      analysis: "Automated market makers are re-aligning their vector weights to optimize for a new stability equilibrium.",
      consequences: "Minimal direct impact on retail users, but institutional-grade liquidity is shifting its gravitational center."
    },
    {
      title: "VOLATILITY_CASCADE",
      theme: "THERMAL",
      intensity: "HIGH",
      impact: "TURBULENCE",
      description: "Rapid price action causing localized thermal anomalies.",
      analysis: "A series of cascading liquidations in the perpetual markets has created a self-reinforcing feedback loop.",
      consequences: "High risk of flash crashes; traders are advised to increase margin safety levels immediately."
    }
  ]
};

export async function fetchRealitySync(): Promise<RealitySyncData | null> {
  let cachedEntry: CachedData | null = null;
  
  // Try to load from cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      cachedEntry = JSON.parse(cached);
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
        console.log("Using cached reality data:", new Date(cachedEntry.timestamp).toLocaleTimeString());
        return cachedEntry.data;
      }
    }
  } catch (e) {
    console.warn("Failed to read reality cache", e);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing - using fallback data");
      return cachedEntry?.data || FALLBACK_DATA;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analyze the current global financial and social volatility. Provide a technical snapshot. Identify 3-5 specific recent major events. For each event, provide a brief description, an 'analysis' of what happened, and 'consequences' for the market impact. Assign themes from: THERMAL, ABYSSAL, ALGO, FRICTION, QUANTUM.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalPressure: { type: Type.NUMBER },
            viscosity: { type: Type.NUMBER },
            turbulence: { type: Type.NUMBER },
            temperature: { type: Type.NUMBER },
            stability: { type: Type.NUMBER },
            pipingIntegrity: { type: Type.NUMBER },
            reservoirDensity: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  theme: { type: Type.STRING, enum: ["THERMAL", "ABYSSAL", "ALGO", "FRICTION", "QUANTUM"] },
                  intensity: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                  impact: { type: Type.STRING, enum: ["PRESSURE", "TEMPERATURE", "TURBULENCE"] },
                  description: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  consequences: { type: Type.STRING }
                },
                required: ["title", "theme", "intensity", "impact", "description", "analysis", "consequences"]
              }
            }
          },
          required: ["globalPressure", "viscosity", "turbulence", "temperature", "stability", "reasoning", "events"]
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text) as RealitySyncData;
    
    // Save to cache
    try {
      const cacheValue: CachedData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheValue));
    } catch (e) {
      console.warn("Failed to write reality cache", e);
    }

    return data;
  } catch (error: any) {
    // Check for quota exceeded error
    const isQuotaError = typeof error === 'object' && 
                        (error?.message?.includes('EXHAUSTED') || 
                         error?.message?.includes('429') ||
                         JSON.stringify(error).includes('RESOURCE_EXHAUSTED'));

    if (isQuotaError) {
      console.warn("Reality Sync: Quota exhausted. Using fallback/cached data.");
    } else {
      console.error("Reality Sync Error:", error);
    }

    // If we have any cached data (even expired), use it. Otherwise use FALLBACK_DATA.
    return cachedEntry?.data || FALLBACK_DATA;
  }
}
