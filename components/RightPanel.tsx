import React, { useState, useEffect, useRef } from 'react';
import { Suggestion, RiskReport, ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, Zap } from 'lucide-react';
import { askAssistant, AssistantResponse } from '../services/geminiService';

interface RightPanelProps {
  selectedText: string;
  documentContent?: string; 
  onInsertContent?: (content: string) => void; 
  onAiAction?: (response: AssistantResponse) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  selectedText,
  documentContent = "",
  onInsertContent,
  onAiAction
}) => {
  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI editor. Select text to edit specific parts, or just ask me to edit the whole document (e.g., "Bold the title").',
      timestamp: new Date()
    }
  ]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAssistantThinking]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAssistantThinking(true);

    // Call API
    const response = await askAssistant(userMsg.text, documentContent, selectedText, chatHistory);

    setIsAssistantThinking(false);

    if (response.type === 'action') {
        // AUTOMATICALLY APPLY CONTENT
        if (onAiAction) {
            onAiAction(response);
        } else if (onInsertContent) {
            // Fallback
            onInsertContent(response.content);
        }

        // Add a system confirmation message
        const isDoc = response.scope === 'document';
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: `<i>(Auto-Applied)</i> Changes applied to ${isDoc ? 'the entire document' : 'the selection'}.`,
            timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMsg]);

    } else {
        // Normal Chat Message
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: response.content,
            timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMsg]);
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-10">
      
      {/* Header */}
      <div className="bg-brand-900 p-4 text-white flex items-center justify-between shadow-md">
         <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-300" />
            <h2 className="font-semibold text-sm tracking-wide">AI Editor Assistant</h2>
         </div>
         <div className="text-[10px] bg-brand-800 px-2 py-1 rounded text-brand-200 border border-brand-700">
            Auto-Apply On
         </div>
      </div>

      {/* Main Content Area - Just Chat Now */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 relative">
        
          <div className="flex flex-col space-y-4">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-brand-100 text-brand-700' : 'bg-white border border-gray-200 text-brand-600 shadow-sm'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-lg text-xs leading-relaxed overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              </div>
            ))}
            
            {isAssistantThinking && (
                 <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Bot size={16} className="text-brand-500 animate-pulse" />
                    </div>
                    <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
                        <Zap size={12} className="text-amber-500 animate-bounce" />
                        <span className="text-xs text-gray-500">Processing changes...</span>
                    </div>
                 </div>
            )}
            <div ref={chatEndRef} />
          </div>
      </div>

      {/* Selected Text Context Indicator */}
      {selectedText && (
          <div className="px-4 py-2 bg-brand-50 border-t border-brand-100 text-[10px] text-brand-700 flex items-center gap-2 truncate">
              <span className="font-bold shrink-0">Selected:</span>
              <span className="italic truncate opacity-80">"{selectedText}"</span>
          </div>
      )}

      {/* Chat Input */}
      <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex gap-2 bg-gray-50 border border-gray-300 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-400 focus-within:bg-white transition-all shadow-sm">
              <input 
                  className="flex-1 text-xs px-2 bg-transparent outline-none"
                  placeholder={selectedText ? "Tell me how to change the selection..." : "Ask me anything about the document..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isAssistantThinking}
                  className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                  <Send size={14} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default RightPanel;