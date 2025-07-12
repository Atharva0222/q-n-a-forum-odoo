import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

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
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates relevant follow-up questions for Q&A platforms. Generate questions that would be useful for learning and discussion."
          },
          {
            role: "user",
            content: `Generate 5 relevant questions about: ${topic}\n\nReturn as JSON with format: {"questions": ["question1", "question2", ...]}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.questions || [];
    } catch (error) {
      console.error('AI Question Generation Error:', error);
      return [];
    }
  }
}

export const aiAssistant = new AIAssistantService();