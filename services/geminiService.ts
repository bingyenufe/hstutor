
import { SYSTEM_INSTRUCTION, OPENROUTER_MODEL } from "../constants";
import { Message } from "../types";

export class GeminiService {
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.API_KEY || '';
  }

  async chat(history: Message[], userInput: string, imageBase64?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API Key is missing. Please set it in environment variables.");
    }

    // 构造 OpenAI 兼容格式的消息列表
    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    // 处理当前输入（支持图文混排）
    const currentContent: any[] = [{ type: "text", text: userInput || "请看这张图" }];
    if (imageBase64) {
      currentContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64 // 包含 data:image/jpeg;base64, 前缀
        }
      });
    }

    messages.push({ role: "user", content: currentContent as any });

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "智学导航AI辅导",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: messages,
          temperature: 0.7,
          top_p: 0.9,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "OpenRouter API 请求失败");
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "抱歉，导师走神了，请再说一遍。";
    } catch (error) {
      console.error("OpenRouter Chat Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
