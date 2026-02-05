import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Search, FileText, Map, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreateReportForm from '@/components/CreateReportForm';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  type: 'Intervention' | 'Mission';
  technician: string;
  date: Date;
  status: 'Draft' | 'Finalized';
}

const mockReports: Report[] = [
  { id: 'REP-001', title: 'Maintenance Préventive Climatisation', type: 'Intervention', technician: 'Jean Dupont', date: new Date(), status: 'Finalized' },
  { id: 'REP-002', title: 'Mission de Formation Bloc Nord', type: 'Mission', technician: 'Sophie Laurent', date: new Date(Date.now() - 86400000), status: 'Finalized' },
  { id: 'REP-003', title: 'Réparation Fuite Hydraulique', type: 'Intervention', technician: 'Ahmed Bensaid', date: new Date(Date.now() - 172800000), status: 'Draft' },
];

const ReportsPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Rapports</h1>
            <p className="text-lg text-muted-foreground">Historique et création de comptes-rendus d'activité.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un Rapport</DialogTitle>
              <DialogDescription>Saisissez les détails de l'intervention ou de la mission.</DialogDescription>
            </DialogHeader>
            <CreateReportForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-l-4 border-blue-500 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">Interventions</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">145 Rapports</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-purple-500 bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">Missions</CardTitle>
            <Map className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">28 Missions</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Journal des Rapports</CardTitle>
              <CardDescription>Tous vos documents centralisés.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Rechercher..." className="pl-10 rounded-xl" />
              </div>
              <Button variant="outline" className="rounded-xl"><Filter size={18} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {mockReports.map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    report.type === 'Intervention' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                  )}>
                    {report.type === 'Intervention' ? <FileText size={20} /> : <Map size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">Par {report.technician} • {format(report.date, 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={report.status === 'Finalized' ? "default" : "secondary"} className="rounded-full">
                    {report.status === 'Finalized' ? 'Validé' : 'Brouillon'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="rounded-xl text-blue-600">Voir PDF</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;