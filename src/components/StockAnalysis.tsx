import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, AlertTriangle, ArrowUpRight, PackageSearch, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const StockAnalysis: React.FC = () => {
  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      setIsLoading(true);
      // On récupère les réactifs et pièces dont le stock est <= min_stock
      const { data: reagents } = await supabase
        .from('lab_reagents')
        .select('name, current_stock, min_stock, unit')
        .lte('current_stock', 'min_stock');
      
      const { data: parts } = await supabase
        .from('spare_parts')
        .select('name, current_stock, min_stock')
        .lte('current_stock', 'min_stock');

      const combined = [
        ...(reagents?.map(r => ({ ...r, type: 'Réactif' })) || []),
        ...(parts?.map(p => ({ ...p, type: 'Pièce', unit: 'unité(s)' })) || [])
      ];

      setCriticalItems(combined);
      setIsLoading(false);
    };
    fetchStock();
  }, []);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <Card className="shadow-xl border-none bg-slate-900 text-white overflow-hidden">
      <CardHeader className="pb-2 border-b border-slate-800">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center text-blue-400">
          <PackageSearch size={16} className="mr-2" /> Analyse Prédictive Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {criticalItems.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {criticalItems.map((item, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{item.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase">{item.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-400">{item.current_stock} / {item.min_stock}</p>
                  <p className="text-[9px] text-slate-500 uppercase">Rupture imminente</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 italic text-xs">
            Stock optimal. Aucune recommandation d'achat.
          </div>
        )}
        <div className="p-4 bg-blue-600/10 border-t border-slate-800">
          <Button variant="link" className="w-full text-[10px] font-black uppercase text-blue-400 h-auto p-0">
            Générer bon de commande <ArrowUpRight size={12} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockAnalysis;