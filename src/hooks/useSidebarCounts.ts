import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSidebarCounts = () => {
  const { user } = useAuth();
  const [chatCount, setChatCount] = useState(0);
  const [breakdownCount, setBreakdownCount] = useState(0);

  const fetchCounts = async () => {
    if (!user) return;

    // 1. Compter les messages privés non lus
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    // 2. Compter les pannes signalées ouvertes
    const { count: brCount } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .not('reporter_name', 'is', null)
      .eq('status', 'Ouvert');

    setChatCount(msgCount || 0);
    setBreakdownCount(brCount || 0);
  };

  useEffect(() => {
    fetchCounts();

    // Abonnements temps réel
    const msgChannel = supabase.channel('count-msgs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchCounts())
      .subscribe();

    const brChannel = supabase.channel('count-breakdowns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => fetchCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(brChannel);
    };
  }, [user]);

  return { chatCount, breakdownCount };
};