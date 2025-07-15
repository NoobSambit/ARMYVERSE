import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  initialize() {
    // Always reinitialize to pick up latest config
    this.initialized = false;
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not found. AI playlist generation will be disabled.');
      this.genAI = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the correct model name format
    const modelName = "gemini-1.5-flash-latest";
    console.log(`🔍 Attempting to use model: ${modelName}`);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    this.initialized = true;
    console.log('✅ Gemini service initialized with model: gemini-1.5-flash');
  }

  async generatePlaylist(theme) {
    // Initialize on first use to ensure env vars are loaded
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.genAI) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
    }

    const prompt = `Give me a playlist of BTS songs that match the theme: "${theme}". Return a numbered list of 5 to 10 BTS song titles only. No album names, no descriptions, just the song titles.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the numbered list into an array of song titles
      const songs = this.parseGeminiResponse(text);
      
      if (songs.length === 0) {
        throw new Error('No songs found in Gemini response');
      }

      return songs;
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw new Error(`Failed to generate playlist: ${error.message}`);
    }
  }

  parseGeminiResponse(text) {
    const lines = text.split('\n');
    const songs = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Match numbered list patterns like "1. Song Title" or "1) Song Title"
      const match = trimmedLine.match(/^\d+[\.\)]\s*(.+)$/);
      
      if (match) {
        const songTitle = match[1].trim();
        // Remove any quotes or extra formatting
        const cleanTitle = songTitle.replace(/^["']|["']$/g, '');
        if (cleanTitle) {
          songs.push(cleanTitle);
        }
      }
    }

    return songs;
  }
}

export default new GeminiService();