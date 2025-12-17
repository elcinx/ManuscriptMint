import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { Suggestion, RiskReport, SuggestionType, Severity, ChatMessage } from "../types";
import { MOCK_SUGGESTIONS, MOCK_RISK_REPORT } from "../constants";

// Helper to clean JSON string if Markdown code blocks are present
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeDocument = async (
  content: string, 
  title: string
): Promise<{ suggestions: Suggestion[]; riskReport: RiskReport }> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No API Key found. Returning mock data.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          suggestions: MOCK_SUGGESTIONS,
          riskReport: MOCK_RISK_REPORT
        });
      }, 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert academic editor for "ManuscriptMint".
      Review the text. Output JSON only.
      
      Structure:
      {
        "suggestions": [{ "id": "uuid", "type": "Grammar"|"Style", "severity": "Low"|"High", "originalText": "...", "suggestedText": "...", "explanation": "..." }],
        "riskReport": { "score": "A/B/C", "label": "...", "warnings": [] }
      }

      Title: ${title}
      Content: ${content.replace(/<[^>]*>/g, '')} 
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(cleanJson(response.text || '{}'));
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { suggestions: MOCK_SUGGESTIONS, riskReport: MOCK_RISK_REPORT };
  }
};

export const smartRefineText = async (selectedText: string, instruction: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return selectedText + " (refined)";
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Refine this text: "${selectedText}" according to: "${instruction}". Return only the text.`,
  });
  return response.text?.trim() || selectedText;
};

// Updated Interface to include scope
export interface AssistantResponse {
  type: 'action' | 'message';
  scope?: 'selection' | 'document';
  content: string; 
}

export const askAssistant = async (
  message: string,
  documentContent: string,
  selectedText: string,
  history: ChatMessage[]
): Promise<AssistantResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { 
      type: 'message', 
      content: "I'm in demo mode (no API key). I can't generate real edits yet." 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');

  // Determine context
  const hasSelection = selectedText && selectedText.trim().length > 0;

  const prompt = `
    You are ManuscriptMint Assistant, an expert academic editor.
    
    CONTEXT:
    - User is in a WYSIWYG editor.
    - Has Selection: ${hasSelection ? 'YES' : 'NO'}
    - Selected Text: "${hasSelection ? selectedText : 'N/A'}"
    - Full Document (HTML): "${documentContent.substring(0, 8000)}"
    
    USER QUERY: "${message}"
    
    INSTRUCTIONS:
    1. If user asks a question (e.g. "What is APA?"), return { "type": "message", "content": "Answer..." }.
    2. If user wants an EDIT:
       CASE A: Text IS selected.
         - Return { "type": "action", "scope": "selection", "content": "HTML to replace ONLY the selection" }.
       CASE B: Text is NOT selected (e.g. "Bold the first paragraph", "Rewrite the abstract").
         - You must return the FULL DOCUMENT HTML with the changes applied.
         - Return { "type": "action", "scope": "document", "content": "FULL HTML OF THE DOCUMENT with changes" }.
         - IMPORTANT: Do not strip existing HTML tags unless necessary for the edit. Keep structure.
    
    OUTPUT JSON ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const parsed = JSON.parse(cleanJson(response.text || '{}'));
    return parsed as AssistantResponse;

  } catch (e) {
    console.error(e);
    return { type: 'message', content: "Sorry, I encountered an error." };
  }
};