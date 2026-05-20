import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  };
  isMe: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMe }) => {
  const senderName = message.profiles 
    ? `${message.profiles.first_name} ${message.profiles.last_name}`
    : "Anonyme";
  
  const initials = message.profiles 
    ? (message.profiles.first_name?.[0] || "") + (message.profiles.last_name?.[0] || "")
    : "??";

  return (
    <div className={cn(
      "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2",
      isMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] gap-3",
        isMe ? "flex-row-reverse" : "flex-row"
      )}>
        {!isMe && (
          <Avatar className="h-8 w-8 mt-1 shadow-sm shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col">
          {!isMe && (
            <span className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">
              {senderName}
            </span>
          )}
          
          <div className={cn(
            "px-4 py-2 rounded-2xl shadow-sm",
            isMe 
              ? "bg-blue-600 text-white rounded-tr-none" 
              : "bg-white border text-slate-800 rounded-tl-none"
          )}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          
          <span className={cn(
            "text-[9px] text-slate-400 mt-1",
            isMe ? "text-right mr-1" : "text-left ml-1"
          )}>
            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;