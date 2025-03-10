import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '@/services/api';
import { FaPaperPlane, FaRobot, FaUser, FaSpinner, FaLightbulb } from 'react-icons/fa';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  onInputGenerated?: (inputContent: string) => void;
  potentialFileId?: string | null;
  potentialFileName?: string | null;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  onInputGenerated,
  potentialFileId,
  potentialFileName
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'こんにちは！LAMMPSシミュレーションについて質問があれば、お気軽にどうぞ。シミュレーションの設定やポテンシャルファイルの探し方についてもアドバイスできます。どのような材料や条件でシミュレーションを実行したいですか？'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ポテンシャルファイルが選択されている場合、追加のメッセージを表示
  useEffect(() => {
    if (potentialFileId && potentialFileName && messages.length === 1) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `ポテンシャルファイル「${potentialFileName}」がアップロードされています。このファイルを使用したシミュレーションについて質問があれば、お気軽にどうぞ。`
        }
      ]);
    }
  }, [potentialFileId, potentialFileName]);

  // Suggested questions
  const suggestedQuestions = [
    "銅のEAMポテンシャルファイルはどこで見つけられますか？",
    "水分子のシミュレーション用のポテンシャルファイルを探しています",
    "ポテンシャルファイルをLAMMPSスクリプトで正しく参照する方法は？",
    "シリコンのTersoffポテンシャルはどこにありますか？"
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      // Format conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // ポテンシャルファイルの情報をシステムメッセージに追加
      let enhancedInput = input;
      if (potentialFileId && potentialFileName) {
        enhancedInput = `${input}\n\n(Note: The user has uploaded a potential file named "${potentialFileName}" that they can use in their simulation.)`;
      }
      
      // Call chat API
      const response = await chatWithAssistant(enhancedInput, conversationHistory);
      
      // Add assistant response
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: response.response }
      ]);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'すみません、エラーが発生しました。もう一度お試しください。' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    setInput(question);
  };

  // Extract LAMMPS input from message
  const extractLAMMPSInput = (message: string) => {
    // Look for code blocks with LAMMPS content
    const codeBlockRegex = /```(?:lammps)?\s*([\s\S]*?)```/;
    const match = message.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  };

  // Handle using LAMMPS input
  const handleUseInput = (message: string) => {
    const input = extractLAMMPSInput(message);
    if (input && onInputGenerated) {
      onInputGenerated(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <FaRobot className="mr-2" /> LAMMPSアシスタント
        </h2>
        <p className="text-sm opacity-80">
          シミュレーションの設定やポテンシャルファイルについて質問してください
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3/4 rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-gray-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === 'assistant' ? (
                  <FaRobot className="mr-2 text-blue-600" />
                ) : (
                  <FaUser className="mr-2 text-gray-600" />
                )}
                <span className="font-semibold">
                  {message.role === 'user' ? 'あなた' : 'アシスタント'}
                </span>
              </div>
              
              <div className="whitespace-pre-wrap">
                {message.content.split('```').map((part, i) => {
                  // Even indices are normal text, odd indices are code blocks
                  if (i % 2 === 0) {
                    return <p key={i}>{part}</p>;
                  } else {
                    // Remove "lammps" from the start if present
                    const code = part.replace(/^lammps\n/, '');
                    return (
                      <div key={i} className="my-2">
                        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                        {message.role === 'assistant' && extractLAMMPSInput('```' + part + '```') && onInputGenerated && (
                          <button
                            onClick={() => handleUseInput('```' + part + '```')}
                            className="mt-1 text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded"
                          >
                            このコードを使用
                          </button>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        ))}
        {showSuggestions && messages.length === 1 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center mb-2 text-blue-700">
              <FaLightbulb className="mr-2" />
              <span className="font-medium">質問例:</span>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestionClick(question)}
                  className="block w-full text-left p-2 bg-white hover:bg-blue-100 rounded border border-blue-200 text-sm transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力してください..."
            className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant; 