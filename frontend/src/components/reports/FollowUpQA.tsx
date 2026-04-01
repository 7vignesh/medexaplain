'use client';

import React, { useState } from 'react';
import { Send, Loader, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FollowUpQAProps {
  analysisId: string;
  onSubmit: (question: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export const FollowUpQA: React.FC<FollowUpQAProps> = ({
  analysisId,
  onSubmit,
  isLoading = false,
  disabled = false,
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || localLoading || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLocalLoading(true);

    try {
      await onSubmit(question);

      // Add assistant message (simulated - in real app, would come from API)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          'Your follow-up question has been processed. Please check the updated analysis above.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error processing question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-cyan-950/70 border border-slate-700 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-cyan-300" />
        Follow-up Questions
      </h3>

      {/* Chat History */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto space-y-3 pb-4 border-b border-slate-700">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-900/40 text-cyan-100 border border-cyan-700'
                    : 'bg-slate-800/40 text-slate-200 border border-slate-700'
                }`}
              >
                <p>{msg.content}</p>
                <span className="text-xs text-slate-400 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a follow-up question about this analysis..."
            disabled={disabled || isLoading || localLoading}
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-600 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {!question.trim() && (
            <>
              <button
                type="button"
                onClick={() =>
                  setQuestion('What are the most concerning findings in this analysis?')
                }
                disabled={disabled || isLoading || localLoading}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 disabled:opacity-50"
              >
                Concerning findings
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuestion('What should I do based on these results?')
                }
                disabled={disabled || isLoading || localLoading}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 disabled:opacity-50"
              >
                Next steps
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuestion('How confident are you in this diagnosis?')
                }
                disabled={disabled || isLoading || localLoading}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 disabled:opacity-50"
              >
                Confidence details
              </button>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!question.trim() || disabled || isLoading || localLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {localLoading || isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Question
            </>
          )}
        </button>
      </form>

      {/* Helper Text */}
      <p className="text-xs text-slate-400 mt-3">
        💡 Ask clarifying questions to better understand the analysis results
      </p>
    </div>
  );
};

export default FollowUpQA;
