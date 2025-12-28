
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { Message } from './types';
import { MAX_ROUNDS } from './constants';
import MarkdownRenderer from './components/MarkdownRenderer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
      image: selectedImage || undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 记忆 MAX_ROUNDS 轮对话
      const history = newMessages.slice(-(MAX_ROUNDS * 2));
      const aiResponse = await geminiService.chat(history.slice(0, -1), userMsg.content, userMsg.image);
      
      const modelMsg: Message = {
        role: 'model',
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "哎呀，连接导师办公室的信号不太好。请检查 API Key 是否正确配置，然后重试一遍吧！",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h1 className="font-bold text-lg text-gray-800 tracking-tight">智学导航 <span className="text-blue-600">高中AI导师</span></h1>
        </div>
        <button 
          onClick={() => {
            if(confirm("确定要清除所有对话记忆吗？")) setMessages([]);
          }}
          className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-3 py-1 rounded-full hover:bg-red-50"
        >
          <i className="fas fa-trash-alt mr-1"></i> 重置对话
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mb-6 text-3xl shadow-xl">
              <i className="fas fa-comment-dots"></i>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">同学你好！</h2>
            <p className="text-gray-500 leading-relaxed mb-6 px-4">
              我是你的苏格拉底式 AI 导师。我不会直接给你答案，但我会引导你发现真理。
              <br/>
              <span className="text-sm font-medium text-blue-500">你可以拍照上传题目，或者直接打字描述。</span>
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex flex-col max-w-[88%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {msg.image && (
                  <div className="mb-3 relative group">
                    <img 
                      src={msg.image} 
                      alt="Uploaded question" 
                      className="max-w-full rounded-lg border border-blue-400 shadow-sm" 
                    />
                  </div>
                )}
                <MarkdownRenderer content={msg.content} />
              </div>
              <span className="text-[10px] text-gray-400 mt-1.5 px-2 font-medium">
                {msg.role === 'user' ? '学生' : '导师'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-blue-600/70 font-medium">导师正在思考引导路径...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="bg-white border-t p-4 pb-8 sm:pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="relative inline-block mb-4 animate-in fade-in zoom-in slide-in-from-bottom-2">
              <img src={selectedImage} className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-lg ring-1 ring-blue-500/20" />
              <button 
                type="button" 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2 bg-gray-50/80 rounded-2xl border border-gray-200 p-2 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
              title="上传题目照片"
            >
              <i className="fas fa-camera text-xl"></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="请详细描述你的困惑，或发送图片..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none max-h-32 text-sm sm:text-base text-gray-700 custom-scrollbar leading-normal"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
            />
            
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
              className={`p-3 w-12 h-12 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
                (!inputText.trim() && !selectedImage) || isLoading
                ? 'bg-gray-100 text-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          <div className="flex justify-between items-center px-1 mt-3">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {messages.length / 2} / {MAX_ROUNDS} 轮对话记忆
            </span>
            <p className="text-[10px] text-gray-400">
              Powered by OpenRouter & Gemini 2.5
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
