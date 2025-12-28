
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from './services/geminiService.ts';
import { Message } from './types.ts';
import { MAX_ROUNDS, AVAILABLE_MODELS, DEFAULT_MODEL } from './constants.ts';
import MarkdownRenderer from './components/MarkdownRenderer.tsx';

const App: React.FC = () => {
  // 安全获取初始值的辅助函数
  const getStoredValue = (key: string, defaultValue: string | null = null) => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [apiKey, setApiKey] = useState<string | null>(getStoredValue('openrouter_api_key'));
  const [selectedModel, setSelectedModel] = useState<string>(getStoredValue('openrouter_model', DEFAULT_MODEL) as string);
  const [tempKey, setTempKey] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanKey = tempKey.trim();
    
    if (cleanKey.length > 20 && cleanKey.startsWith('sk-')) {
      setIsSavingKey(true);
      try {
        localStorage.setItem('openrouter_api_key', cleanKey);
      } catch (err) {}
      
      setApiKey(cleanKey);
      setIsSavingKey(false);
    } else {
      setErrorMessage('请输入有效的 OpenRouter API Key (通常以 sk- 开头)');
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    try {
      localStorage.setItem('openrouter_model', newModel);
    } catch (err) {}
  };

  const handleLogout = () => {
    if (confirm('确定要清除 API Key 并退出吗？')) {
      try {
        localStorage.removeItem('openrouter_api_key');
      } catch (e) {}
      setApiKey(null);
      setMessages([]);
      setTempKey('');
    }
  };

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
    if (!apiKey || ((!inputText.trim() && !selectedImage) || isLoading)) return;

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
      const history = newMessages.slice(-(MAX_ROUNDS * 2));
      const aiResponse = await geminiService.chat(apiKey, selectedModel, history.slice(0, -1), userMsg.content, userMsg.image);
      
      const modelMsg: Message = {
        role: 'model',
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorStr = error.toString();
      const isAuthError = errorStr.includes('401') || errorStr.includes('验证失败');
      
      setMessages(prev => [...prev, {
        role: 'model',
        content: isAuthError 
          ? "⚠️ **API Key 验证失败**。请检查你的密钥是否正确。" 
          : `哎呀，导师办公室信号不好：${error.message || '未知错误'}`,
        timestamp: Date.now()
      }]);

      if (isAuthError) {
        try { localStorage.removeItem('openrouter_api_key'); } catch (e) {}
        setTimeout(() => setApiKey(null), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 mx-auto shadow-lg shadow-blue-200">
            <i className={`fas ${isSavingKey ? 'fa-circle-notch fa-spin' : 'fa-key'}`}></i>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">欢迎来到导师办公室</h2>
          <p className="text-slate-500 text-center text-sm mb-8 px-4">
            请输入 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter API Key</a> 开启辅导。
          </p>
          
          <form onSubmit={handleSaveKey} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 ml-1 tracking-wider">API Key</label>
              <input 
                type="password"
                placeholder="sk-or-v1-..."
                autoFocus
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-mono ${
                  errorMessage ? 'border-red-300' : 'border-slate-200'
                }`}
                required
              />
              {errorMessage && <p className="mt-2 text-xs text-red-500 font-medium px-1">{errorMessage}</p>}
            </div>

            <button 
              type="submit"
              disabled={isSavingKey}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSavingKey ? '正在进入...' : '开启辅导之旅'}
            </button>
          </form>
          <p className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed">
            还没有 Key？访问 <a href="https://openrouter.ai/" className="underline" target="_blank" rel="noopener noreferrer">openrouter.ai</a> 注册。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <i className="fas fa-graduation-cap text-sm"></i>
          </div>
          <h1 className="font-bold text-sm sm:text-lg text-gray-800 tracking-tight">智学导航 <span className="hidden sm:inline text-blue-600">高中AI导师</span></h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={handleModelChange}
                className="text-[10px] sm:text-xs font-bold bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 text-gray-600 focus:ring-0 cursor-pointer hover:bg-slate-200 transition-colors appearance-none pr-8"
              >
                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-400 pointer-events-none"></i>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={handleLogout}
                className="text-[10px] font-medium text-gray-400 hover:text-blue-600 transition-colors px-2 py-1.5 rounded-full hover:bg-blue-50"
                title="修改 API Key"
              >
                <i className="fas fa-cog mr-1"></i> 修改Key
              </button>
              <button 
                onClick={() => {
                  if(confirm("确定要清除当前对话并开始新的问答吗？")) setMessages([]);
                }}
                className="text-[10px] font-bold text-blue-600 transition-colors px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 hover:bg-blue-100"
              >
                <i className="fas fa-redo mr-1"></i> 问新问题请先重置
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto animate-in fade-in duration-700">
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
                  <div className="mb-3">
                    <img src={msg.image} alt="Question" className="max-w-full rounded-lg border border-blue-400/30 shadow-sm" />
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
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-blue-600/70 font-medium">导师正在思考引导路径...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="bg-white border-t p-4 pb-8 sm:pb-6">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="relative inline-block mb-4 animate-in fade-in zoom-in">
              <img src={selectedImage} className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-lg ring-1 ring-blue-500/20" />
              <button 
                type="button" 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-blue-600 transition-colors"
              title="拍照或选择图片"
            >
              <i className="fas fa-camera text-xl"></i>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
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
              className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none max-h-32 text-sm leading-normal"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
              className={`p-3 w-12 h-12 rounded-xl transition-all flex items-center justify-center ${
                (!inputText.trim() && !selectedImage) || isLoading
                ? 'bg-gray-100 text-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95'
              }`}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          <div className="flex justify-between items-center px-1 mt-3">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              记忆：{Math.floor(messages.length / 2)} / {MAX_ROUNDS} 轮
            </span>
            <p className="text-[10px] text-gray-400 italic">循序而渐进，熟读而精思。</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
