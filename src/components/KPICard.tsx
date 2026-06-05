import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  icon: React.ReactNode;
  borderColorClass?: string;
  iconBgClass?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  description,
  icon,
  borderColorClass = "border-l-blue-600",
  iconBgClass = "bg-blue-50 text-blue-600"
}) => {
  return (
    <Card className={cn("shadow-lg transition-transform hover:scale-[1.02] border-l-4 bg-white", borderColorClass)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", iconBgClass)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{description}</p>
      </CardContent>
    </Card>
  );
};