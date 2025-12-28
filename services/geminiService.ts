
import { SYSTEM_INSTRUCTION, OPENROUTER_MODEL } from "../constants.ts";
import { Message } from "../types.ts";

export class GeminiService {
  private getApiKey(): string {
    // 兼容浏览器直接运行和构建工具环境
    // @ts-ignore
    return process?.env?.API_KEY || window?.process?.env?.API_KEY || '';
  }

  private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";

  async chat(history: Message[], userInput: string, imageBase64?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("API Key 未配置。请在 Vercel 环境变量中设置 API_KEY。");
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
        throw new Error(errorData.error?.message || "API 请求失败");
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
