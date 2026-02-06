"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export function AiSidebar({ isOpen, onClose, content }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hola, soy tu asistente de contenido. ¿En qué puedo ayudarte hoy con este post?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          text: userMsg,
          context: content
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.result }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "Lo siento, tuve un problema al procesar tu solicitud." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className={`fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
            isOpen ? "translate-x-0" : "translate-x-full"
        }`}
    >
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/40">
            <h3 className="font-semibold flex items-center gap-2">
                <span className="text-xl">🤖</span> Chat Asistente
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-foreground"
                    }`}>
                        <div className="prose dark:prose-invert prose-xs">
                            <ReactMarkdown>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Pregunta sobre tu post..."
                    className="flex-1 resize-none h-10 min-h-[40px] max-h-32 bg-muted border-transparent focus:bg-background border focus:border-ring rounded-md px-3 py-2 text-sm focus:outline-none"
                    rows={1}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                La IA puede cometer errores.
            </p>
        </div>
    </div>
  );
}
