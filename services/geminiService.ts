
import { SYSTEM_INSTRUCTION, OPENROUTER_MODEL } from "../constants.ts";
import { Message } from "../types.ts";

export class GeminiService {
  private getApiKey(): string {
    // 兼容浏览器直接运行、Vercel 注入以及 window 级 polyfill
    try {
      // @ts-ignore
      return (typeof process !== 'undefined' && process.env?.API_KEY) || 
             (window as any).process?.env?.API_KEY || 
             '';
    } catch (e) {
      return (window as any).process?.env?.API_KEY || '';
    }
  }

  private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";

  async chat(history: Message[], userInput: string, imageBase64?: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error("检测到 API Key 未配置。请在 Vercel Settings -> Environment Variables 中添加 API_KEY，然后点击 Redeploy 重新部署。");
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
        const errorMsg = errorData.error?.message || `请求失败 (状态码: ${response.status})`;
        
        if (response.status === 401) {
          throw new Error("API Key 验证失败，请确认 OpenRouter 密钥是否正确。");
        }
        if (response.status === 402) {
          throw new Error("OpenRouter 账户余额不足，请充值后重试。");
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
