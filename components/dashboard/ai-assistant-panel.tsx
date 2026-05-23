"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aiSuggestions } from "@/lib/dashboard/mock-data";

export function AiAssistantPanel() {
  const [input, setInput] = useState("");
  type ChatMessage = { role: "user" | "assistant"; text: string };
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hello! I can help with approvals, finance insights, GST compliance, and workflow automation. What would you like to explore?",
    },
  ]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [
      ...m,
      { role: "user" as const, text: userMsg },
      {
        role: "assistant" as const,
        text: "I'm analyzing your request across Acme India's tenant data. This is a demo response — connect the AI agent API for live answers.",
      },
    ]);
    setInput("");
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Enterprise copilot · GPT-powered</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 min-h-[200px] max-h-[280px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "user"
                  ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "mr-4 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              }
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {aiSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about finance, compliance, workflows..."
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <Button size="icon" onClick={handleSend} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
