import React from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl shadow-2xl border-none overflow-hidden" align="end">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider">Notifications</h3>
          <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full">{unreadCount} nouvelles</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={cn(
                  "p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer group relative",
                  !n.is_read && "bg-blue-50/50"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                  {!n.is_read && <div className="h-2 w-2 bg-blue-600 rounded-full" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400">
                    {format(new Date(n.created_at), 'dd/MM HH:mm', { locale: fr })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <Check size={12} className="text-green-600" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              Aucune notification.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;