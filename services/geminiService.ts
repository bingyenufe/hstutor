
import { SYSTEM_INSTRUCTION } from "../constants.ts";
import { Message } from "../types.ts";

export class GeminiService {
  private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";

  async chat(apiKey: string, model: string, history: Message[], userInput: string, imageBase64?: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API Key 缺失，请先输入有效的密钥。");
    }

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    const currentContent: any[] = [{ type: "text", text: userInput || "请看这张图" }];
    if (imageBase64) {
      currentContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    messages.push({ role: "user", content: currentContent as any });

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "ZhiXue AI Tutor",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          top_p: 0.9,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `请求失败 (状态码: ${response.status})`;
        
        if (response.status === 401) {
          throw new Error("API Key 验证失败，请确认密钥是否正确或已过期。");
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "抱歉，导师刚才走神了，没能给出回应。";
    } catch (error: any) {
      console.error("OpenRouter API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
