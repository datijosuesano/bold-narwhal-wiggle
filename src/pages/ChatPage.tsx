import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Users, User, Hash, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRole } from '@/utils/constants';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null); // null = Communauté
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charger les profils des membres
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, role').neq('id', user?.id).order('last_name');
      setProfiles(data || []);
    };
    fetchProfiles();
  }, [user]);

  // Charger les messages et s'abonner au temps réel
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      let query = supabase
        .from('messages')
        .select('*, profiles:sender_id(first_name, last_name)');

      if (selectedRecipient) {
        // Chat Privé : Messages entre moi et le destinataire
        query = query.or(`and(sender_id.eq.${user?.id},recipient_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},recipient_id.eq.${user?.id})`);
      } else {
        // Chat Communautaire : Pas de destinataire
        query = query.eq('is_private', false);
      }

      const { data } = await query.order('created_at', { ascending: true });
      setMessages(data || []);
      setIsLoading(false);
    };

    fetchMessages();

    // Abonnement Realtime
    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      (payload) => {
        const newMessage = payload.new;
        // On vérifie si le message doit s'afficher dans la vue actuelle
        const isForCommunity = !newMessage.is_private && !selectedRecipient;
        const isForCurrentPrivate = selectedRecipient && (
          (newMessage.sender_id === user?.id && newMessage.recipient_id === selectedRecipient.id) ||
          (newMessage.sender_id === selectedRecipient.id && newMessage.recipient_id === user?.id)
        );

        if (isForCommunity || isForCurrentPrivate) {
          // Re-fetch message with profile info (simplifié pour l'exemple)
          supabase.from('profiles').select('first_name, last_name').eq('id', newMessage.sender_id).single()
            .then(({ data }) => {
              setMessages(prev => [...prev, { ...newMessage, profiles: data }]);
            });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRecipient, user]);

  // Auto-scroll en bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedRecipient?.id || null,
      content,
      is_private: !!selectedRecipient
    });
  };

  const filteredProfiles = profiles.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-in fade-in duration-500">
      {/* Barre Latérale - Liste des contacts */}
      <div className="w-80 flex flex-col gap-4">
        <Card className="flex-1 shadow-xl border-none overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-widest flex items-center">
              <MessageSquare size={16} className="mr-2 text-blue-400" /> Discussions
            </h3>
          </div>
          
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input 
                placeholder="Chercher un membre..." 
                className="pl-8 h-9 text-xs rounded-xl bg-slate-50 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            <button
              onClick={() => setSelectedRecipient(null)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all group",
                !selectedRecipient ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-100"
              )}
            >
              <div className={cn("p-2 rounded-lg mr-3", !selectedRecipient ? "bg-white/20" : "bg-blue-100 text-blue-600")}>
                <Users size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Communauté</p>
                <p className={cn("text-[10px]", !selectedRecipient ? "text-blue-100" : "text-slate-400")}>Canal général</p>
              </div>
            </button>

            <div className="pt-4 pb-2 px-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Membres de l'équipe</p>
            </div>

            {filteredProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedRecipient(p)}
                className={cn(
                  "w-full flex items-center p-3 rounded-xl transition-all",
                  selectedRecipient?.id === p.id ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-100"
                )}
              >
                <Avatar className="h-9 w-9 mr-3 border-2 border-transparent group-hover:border-blue-200">
                  <AvatarFallback className={cn(
                    "text-[10px] font-black",
                    selectedRecipient?.id === p.id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
                  )}>
                    {p.first_name[0]}{p.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 truncate">
                  <p className="text-sm font-bold truncate">{p.first_name} {p.last_name}</p>
                  <p className={cn("text-[9px] uppercase font-medium", selectedRecipient?.id === p.id ? "text-blue-100" : "text-slate-500")}>
                    {formatRole(p.role)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Fenêtre de Chat */}
      <Card className="flex-1 shadow-2xl border-none overflow-hidden flex flex-col bg-slate-50/50">
        <div className="p-4 bg-white border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              {selectedRecipient ? <User size={20} /> : <Hash size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">
                {selectedRecipient ? `${selectedRecipient.first_name} ${selectedRecipient.last_name}` : "Canal Communauté"}
              </h2>
              <div className="flex items-center mt-1">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {selectedRecipient ? "Discussion privée" : "Tout le staff technique"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} isMe={msg.sender_id === user?.id} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40">
              <MessageSquare size={64} className="mb-4" />
              <p className="text-sm font-bold italic">Aucun message pour le moment.</p>
              <p className="text-xs">Soyez le premier à engager la conversation !</p>
            </div>
          )}
        </div>

        <ChatInput 
          onSend={handleSendMessage} 
          placeholder={selectedRecipient ? `Envoyer un message privé à ${selectedRecipient.first_name}...` : "Envoyer un message à la communauté..."}
        />
      </Card>
    </div>
  );
};

export default ChatPage;