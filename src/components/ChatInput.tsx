import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, placeholder = "Votre message..." }) => {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend(content.trim());
      setContent("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 p-4 bg-white border-t items-center">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-slate-200 focus-visible:ring-blue-600"
        disabled={isSending}
      />
      <Button 
        type="submit" 
        size="icon" 
        className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0 shadow-lg"
        disabled={!content.trim() || isSending}
      >
        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  );
};

export default ChatInput;