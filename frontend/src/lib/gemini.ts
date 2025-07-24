import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private useDirectAPI: boolean = false;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('Gemini API key not found. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
    } else {
      console.log('Gemini API key loaded:', apiKey.substring(0, 10) + '...');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Try with Gemini 2.0 Flash - use direct API if SDK doesn't support it
    try {
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });
    } catch (error) {
      console.warn('Gemini 2.0 Flash not available in SDK, will use direct API calls');
      this.useDirectAPI = true;
    }
  }

  private async callGeminiDirectAPI(prompt: string): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    console.log('Direct API - Using API key:', apiKey.substring(0, 10) + '...' + apiKey.slice(-4));
    console.log('Direct API - Full API key length:', apiKey.length);
    console.log('Direct API - API key (first 20 chars):', apiKey.substring(0, 20));

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct API call failed:', response.status, errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Unexpected response format from Gemini API');
  }

  async testApiKey(): Promise<boolean> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        console.error('No API key found');
        return false;
      }

      console.log('Testing API key with Gemini 2.0 Flash...');
      
      if (this.useDirectAPI) {
        console.log('Using direct API approach');
        const result = await this.callGeminiDirectAPI('Hi');
        console.log('API key test successful:', result.substring(0, 50) + '...');
        return true;
      } else {
        console.log('Using SDK approach');
        console.log('Using model:', this.model);
        console.log('API Key (first 10 chars):', apiKey.substring(0, 10));
        
        const result = await this.model.generateContent('Hi');
        console.log('Raw result:', result);
        
        const response = await result.response;
        console.log('Response object:', response);
        
        const text = response.text();
        console.log('API key test successful:', text.substring(0, 50) + '...');
        return true;
      }
    } catch (error: any) {
      console.error('API key test failed:', error);
      
      // If SDK fails, try direct API
      if (!this.useDirectAPI) {
        console.log('SDK failed, trying direct API...');
        this.useDirectAPI = true;
        return await this.testApiKey();
      }
      
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        stack: error.stack
      });
      
      return false;
    }
  }

  async generateCode(prompt: string): Promise<string> {
    console.log('=== Starting code generation ===');
    console.log('Environment check - NEXT_PUBLIC_GEMINI_API_KEY present:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    console.log('Environment check - API key length:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Gemini API key is not configured. Please add a valid NEXT_PUBLIC_GEMINI_API_KEY to your .env file.');
      }

      console.log('Generating code with Gemini 2.0 Flash, prompt:', prompt.substring(0, 100) + '...');

      const fullPrompt = `
You are a React/Next.js expert helping to create components. 

User request: ${prompt}

Please provide clean, modern React code using:
- TypeScript/TSX
- Tailwind CSS for styling
- Modern React patterns (hooks, functional components)
- Proper TypeScript types
- Clean, readable code with comments

Return only the code without markdown formatting or explanations.
`;

      let text: string;
      
      if (this.useDirectAPI) {
        console.log('Using direct API for code generation');
        text = await this.callGeminiDirectAPI(fullPrompt);
      } else {
        try {
          const result = await this.model.generateContent(fullPrompt);
          const response = await result.response;
          text = response.text();
        } catch (error) {
          console.log('SDK failed, switching to direct API');
          this.useDirectAPI = true;
          text = await this.callGeminiDirectAPI(fullPrompt);
        }
      }
      
      console.log('Code generation successful, response length:', text.length);
      return text;
    } catch (error: any) {
      console.error('Error generating code:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details
      });
      
      if (error?.message?.includes('API key not valid') || error?.status === 400) {
        throw new Error('Invalid Gemini API key. Please check your API key in the .env file.');
      }
      
      if (error?.message?.includes('API key is not configured')) {
        throw error;
      }
      
      throw new Error(`Failed to generate code: ${error.message || 'Unknown error'}`);
    }
  }

  async chatWithAI(message: string, chatHistory: Array<{role: string, content: string}>): Promise<string> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Gemini API key is not configured. Please add a valid NEXT_PUBLIC_GEMINI_API_KEY to your .env file.');
      }

      const context = chatHistory.length > 0 
        ? `Previous conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
        : '';

      const prompt = `
${context}You are an AI assistant specialized in React/Next.js development. 
Help the user with their coding questions, component generation, and development guidance.

Current message: ${message}

Provide helpful, accurate responses about React, Next.js, TypeScript, and modern web development.
`;

      let text: string;
      
      if (this.useDirectAPI) {
        console.log('Using direct API for chat');
        text = await this.callGeminiDirectAPI(prompt);
      } else {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          text = response.text();
        } catch (error) {
          console.log('SDK failed, switching to direct API');
          this.useDirectAPI = true;
          text = await this.callGeminiDirectAPI(prompt);
        }
      }
      
      return text;
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      
      if (error?.message?.includes('API key not valid')) {
        throw new Error('Invalid Gemini API key. Please check your API key in the .env file.');
      }
      
      if (error?.message?.includes('API key is not configured')) {
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again or check your API key.');
    }
  }
}

export const geminiService = new GeminiService();
