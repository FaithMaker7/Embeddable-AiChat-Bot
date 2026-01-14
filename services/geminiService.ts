import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, Attachment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We prefer 'gemini-3-flash-preview' for chat widgets due to speed and cost effectiveness
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Converts internal Message format to Gemini Chat History format
 */
const convertHistory = (messages: Message[]) => {
  return messages.map(msg => {
    const parts: any[] = [];
    
    // Add text if exists
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Add attachments if exist
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    return {
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: parts
    };
  });
};

export const streamChatResponse = async (
  history: Message[],
  currentText: string,
  currentAttachments: Attachment[],
  onChunk: (text: string) => void
): Promise<void> => {
  
  try {
    // 1. Initialize Chat with previous history
    // Note: In a real prod app, you might want to limit context window size
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: convertHistory(history),
      config: {
        systemInstruction: "You are a helpful, friendly AI web assistant. Keep your responses concise and relevant to the user's queries. You can analyze images and files.",
      }
    });

    // 2. Prepare current message parts
    const parts: any[] = [];
    if (currentText) {
      parts.push({ text: currentText });
    }
    
    currentAttachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    // 3. Send message stream
    // The SDK expects 'message' which can be a string or array of parts.
    const resultStream = await chat.sendMessageStream({ 
      message: parts.length === 1 && parts[0].text ? parts[0].text : parts 
    });

    // 4. Iterate over chunks
    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      if (responseChunk.text) {
        onChunk(responseChunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};