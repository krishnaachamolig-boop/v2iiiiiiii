import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import type { ChatMessage } from "@/lib/chatStore";

export function MessageBubble({ message, onSpeak }: { message: ChatMessage; onSpeak?: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-xl2 px-4 py-3 text-sm leading-relaxed",
          isUser ? "bg-neon-cyan/15 text-slate-100" : "glass-card text-slate-100"
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-base-950">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && (
          <div className="mt-2 flex gap-3 text-xs text-slate-500">
            <button onClick={copy} className="hover:text-neon-cyan">
              {copied ? "Copied" : "Copy"}
            </button>
            {onSpeak && (
              <button onClick={() => onSpeak(message.content)} className="hover:text-neon-cyan">
                Play
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
