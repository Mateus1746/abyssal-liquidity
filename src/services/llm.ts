import { GoogleGenAI } from '@google/genai';
import { TimelineEvent } from '../types';

export async function processEvent(event: TimelineEvent): Promise<TimelineEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ...event,
      consequences: `System is now operating on localized simulation models, reducing sync cost while maintaining structural fidelity.`,
      impact: 'MODERATE_RESTRICTION',
      intensity: 'MEDIUM',
      theme: event.theme
    } as TimelineEvent;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this simulation event and provide its impact, intensity, and consequences in a sci-fi, slightly ominous tone.
        Keep it concise, technical, and atmospheric.

        Event: ${event.title}
        Description: ${event.description}
        Theme: ${event.theme}

        Respond ONLY with a valid JSON object matching this exact structure:
        {
          "impact": "STRING (like 'SYSTEM_COMPROMISE' or 'CONTAINMENT_BREACH')",
          "intensity": "STRING (one of: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
          "consequences": "STRING (1-2 sentences explaining the fallout)"
        }
      `,
      config: {
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from LLM');

    // Simple JSON extraction to handle potential markdown wrappers from the LLM
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse LLM response as JSON');

    const result = JSON.parse(jsonMatch[0]);

    return {
      ...event,
      impact: result.impact,
      intensity: result.intensity,
      consequences: result.consequences
    };
  } catch (error) {
    console.error('LLM Processing Error:', error);
    // Fallback if LLM fails
    return {
      ...event,
      impact: 'UNKNOWN_ANOMALY',
      intensity: 'HIGH',
      consequences: 'Analysis subsystem failure. Reality sync maintaining best-effort cohesion.'
    } as TimelineEvent;
  }
}
