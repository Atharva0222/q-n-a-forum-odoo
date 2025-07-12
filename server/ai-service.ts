import { GoogleGenAI } from '@google/genai';

// Using Google's Gemini model instead of OpenAI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AIAssistantRequest {
  content: string;
  action: 'polish' | 'suggest-title' | 'clarify' | 'concise';
  context?: 'question' | 'answer';
}

export interface AIAssistantResponse {
  originalContent: string;
  improvedContent: string;
  suggestions: string[];
  reasoning: string;
}

export class AIAssistantService {
  async processContent(request: AIAssistantRequest): Promise<AIAssistantResponse> {
    const { content, action, context = 'question' } = request;

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case 'polish':
        systemPrompt = `You are a writing assistant that helps improve the quality of ${context}s on a Q&A platform. Focus on grammar, clarity, tone, and structure while maintaining the original meaning and technical accuracy. Return your response in JSON format.`;
        userPrompt = `Please polish and improve this ${context}:\n\n${content}\n\nReturn as JSON: {"improved_content": "improved text", "reasoning": "explanation of changes"}`;
        break;

      case 'suggest-title':
        systemPrompt = `You are a title optimization expert for Q&A platforms. Create clear, specific, and searchable titles that accurately reflect the question's content. Return your response in JSON format.`;
        userPrompt = `Based on this question content, suggest 3 better titles:\n\n${content}\n\nMake titles specific, searchable, and clear about what the person is asking. Return as JSON: {"titles": ["title1", "title2", "title3"], "reasoning": "explanation"}`;
        break;

      case 'clarify':
        systemPrompt = `You are a clarity expert who helps make technical content more understandable. Focus on structure, explanation, and removing ambiguity while keeping technical accuracy. Return your response in JSON format.`;
        userPrompt = `Please make this ${context} clearer and easier to understand:\n\n${content}\n\nReturn as JSON: {"improved_content": "clearer text", "reasoning": "explanation of improvements"}`;
        break;

      case 'concise':
        systemPrompt = `You are an editing expert who makes content more concise while preserving all important information and technical details. Return your response in JSON format.`;
        userPrompt = `Please make this ${context} more concise and to-the-point:\n\n${content}\n\nReturn as JSON: {"improved_content": "concise text", "reasoning": "explanation of changes"}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              improved_content: { type: "string" },
              titles: { type: "array", items: { type: "string" } },
              reasoning: { type: "string" }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');

      // Handle different response formats based on action
      if (action === 'suggest-title') {
        return {
          originalContent: content,
          improvedContent: result.titles?.[0] || content,
          suggestions: result.titles || [result.title || content],
          reasoning: result.reasoning || "Generated title suggestions"
        };
      } else {
        return {
          originalContent: content,
          improvedContent: result.improved_content || result.content || result.improved || content,
          suggestions: result.suggestions || [],
          reasoning: result.reasoning || result.explanation || result.changes || "Content improved"
        };
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      throw new Error('Failed to process content with AI assistant');
    }
  }

  async generateQuestionSuggestions(topic: string): Promise<string[]> {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ 
          role: "user", 
          parts: [{ 
            text: `You are a helpful assistant that generates relevant follow-up questions for Q&A platforms. Generate questions that would be useful for learning and discussion.

Generate 5 relevant questions about: ${topic}

Return as JSON with format: {"questions": ["question1", "question2", ...]}` 
          }] 
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: { type: "array", items: { type: "string" } }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      return result.questions || [];
    } catch (error) {
      console.error('AI Question Generation Error:', error);
      return [];
    }
  }
}

export const aiAssistant = new AIAssistantService();