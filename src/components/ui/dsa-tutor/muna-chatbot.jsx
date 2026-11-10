import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  Check,
  StopCircle,
  MessageSquare,
  X,
  ChevronDown
} from "lucide-react";

export function MunaChatbot({ activeProblem, currentLanguage }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "model",
      content: "Hello! I am **Muna AI**, your personal DSA tutor. Ask me anything about the current problem! You can request visual explanations, code conversions, mock interviews, or step-by-step walk-throughs.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, isOpen]);

  // Suggested Prompts
  const suggestedPrompts = [
    "Explain recursion simply",
    "Explain like I'm 10",
    "Convert to C++",
    "Interview me on this pattern",
    "Why not use a HashMap?"
  ];

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    setInputValue("");
    const userMessageId = `msg-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsGenerating(true);
    const botMessageId = `msg-${Date.now() + 1}`;
    
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: "model",
        content: "",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!apiKey) {
      setTimeout(() => {
        let responseText = `*(Simulated Muna AI response - GEMINI_API_KEY offline)*\n\nRegarding: *"${text}"* on **${activeProblem?.title || "selected problem"}**.\n\n1. **Concept**: When solving this type of problem, we aim to reduce iterations using auxiliary space.\n2. **Optimization**: The optimal approach allows us to achieve **${activeProblem?.optimalApproach?.complexity || "O(N)"}** runtime.\n3. **Clue**: Think about the boundary variables and base conditions first. Let me know if you would like hints or a code walk-through!`;
        
        let currentText = "";
        let index = 0;
        const interval = setInterval(() => {
          if (index < responseText.length) {
            currentText += responseText.charAt(index);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId ? { ...msg, content: currentText } : msg
              )
            );
            index += 2;
          } else {
            clearInterval(interval);
            setIsGenerating(false);
          }
        }, 15);
      }, 500);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chatHistory = messages.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const systemPrompt = `You are Muna AI, a friendly green-glowing DSA tutor bot inside the TraceIQ platform.
Current problem context:
- Title: ${activeProblem?.title || "Unknown"}
- Category: ${activeProblem?.category || "Unknown"}
- Difficulty: ${activeProblem?.difficulty || "Unknown"}
- Target UI/Response Language: ${currentLanguage || "English"}

Understand the user's intent. If they request code, convert it into the requested language or format. If they request 'hints only', guide them without giving the solution. If they ask questions like 'why left++?' explain the pointers. Always match their requested language (e.g. Hindi, Tamil, Telugu, Spanish). Use clean markdown formatting, tables, and code blocks where appropriate.`;

      const chatSession = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will act as Muna AI, tutor the user on the current problem, and output in the requested language using markdown." }] },
          ...chatHistory
        ]
      });

      const result = await chatSession.sendMessageStream(text);
      let streamText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        streamText += chunkText;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: streamText } : msg
          )
        );
      }
    } catch (err) {
      console.error("Muna AI stream failed:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: `⚠️ **Muna AI error:** ${err.message || "Failed to fetch response."}` }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.35)] z-50 transition-all hover:scale-105 active:scale-95"
        title="Open Muna AI Chat"
      >
        <div className="relative">
          {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          {!isOpen && (
            <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-emerald-500 border border-black animate-ping" />
          )}
        </div>
      </button>

      {/* Floating Chat Box Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-6 w-[340px] h-[480px] bg-[var(--color-surface-raised)]/95 border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-50 select-text"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/80 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <Bot className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-[var(--color-surface)] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-caption font-extrabold text-[var(--color-text-primary)]">🤖 Muna AI</h3>
                  <p className="text-[10px] text-zinc-500 font-mono font-medium">Always here to help</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessages([{ id: "welcome", role: "model", content: "Chat reset. Ask me anything!", timestamp: new Date().toLocaleTimeString() }])}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer uppercase tracking-wider"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => {
                const isModel = msg.role === "model";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 max-w-[88%] ${isModel ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    <div
                      className={`h-6.5 w-6.5 shrink-0 rounded-full flex items-center justify-center text-micro ${
                        isModel
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                          : "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-subtle-border)]"
                      }`}
                    >
                      {isModel ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div
                        className={`p-3 text-[12px] leading-relaxed font-sans border shadow-sm ${
                          isModel
                            ? "bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[14px_14px_14px_4px]"
                            : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] rounded-[14px_14px_4px_14px]"
                        }`}
                      >
                        <ReactMarkdown
                          components={{
                            pre: ({ node, ...props }) => (
                              <pre className="overflow-x-auto bg-[var(--color-canvas)] border border-[var(--color-border)] p-2 rounded-md font-mono text-[10px] text-[var(--color-text-primary)] my-2 select-text" {...props} />
                            ),
                            code: ({ node, ...props }) => (
                              <code className="px-1 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-mono text-[10px]" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto my-2 border border-[var(--color-border)] rounded-md">
                                <table className="w-full text-left text-micro font-sans" {...props} />
                              </div>
                            ),
                            th: ({ node, ...props }) => (
                              <th className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] font-bold" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="p-2 border-b border-[var(--color-border)] text-zinc-300" {...props} />
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      <div className="flex items-center gap-1.5 px-1 text-[8px] font-mono text-zinc-600">
                        <span>{msg.timestamp}</span>
                        {isModel && msg.content && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="hover:text-zinc-400 cursor-pointer"
                            >
                              {copiedId === msg.id ? "Copied" : "Copy"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex gap-2 max-w-[88%] mr-auto items-center animate-pulse">
                  <div className="h-6.5 w-6.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Bot className="h-3 w-3 animate-spin" />
                  </div>
                  <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-[14px_14px_14px_4px] text-micro text-zinc-500 font-sans italic flex items-center gap-1 shadow-sm">
                    <span>Muna is typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested prompts list inside chat feed */}
            {messages.length === 1 && (
              <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/20 shrink-0">
                <span className="text-[9px] font-bold text-[var(--color-text-secondary)] block mb-1.5 tracking-wider uppercase font-sans select-none">
                  Suggested Prompts
                </span>
                <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[10px] font-medium bg-[var(--color-canvas)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full px-2.5 py-0.5 text-left transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shrink-0 select-none">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Type a message..."
                  className="flex-1 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-full py-2 px-3 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-600 disabled:opacity-50"
                />

                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => setIsGenerating(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <StopCircle className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] disabled:bg-zinc-800 text-black disabled:text-zinc-500 hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
