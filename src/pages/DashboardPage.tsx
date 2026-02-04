import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Factory, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

const DashboardPage: React.FC = () => {
  // Données mockées pour les graphiques
  const weeklyData = [
    { name: 'Lun', ot: 4 },
    { name: 'Mar', ot: 7 },
    { name: 'Mer', ot: 5 },
    { name: 'Jeu', ot: 8 },
    { name: 'Ven', ot: 6 },
    { name: 'Sam', ot: 2 },
    { name: 'Dim', ot: 1 },
  ];

  const typeData = [
    { name: 'Préventif', value: 65, color: '#2563eb' },
    { name: 'Correctif', value: 35, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Tableau de Bord GMAO
        </h1>
        <p className="text-lg text-muted-foreground">
          Analyse de la performance et de l'état du parc matériel.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-l-4 border-blue-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">OT Ouverts</CardTitle>
            <Wrench className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">+2 cette semaine</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-l-4 border-red-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">En Panne</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-red-500 font-medium mt-1">Actions urgentes requises</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-amber-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">MTTR (Moyen)</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground mt-1">-12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-green-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Disponibilité</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Objectif: 99%</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-xl border-none">
          <CardHeader>
            <CardTitle>Activité des Ordres de Travail</CardTitle>
            <CardDescription>Volume d'interventions sur les 7 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ot" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle>Répartition Maintenance</CardTitle>
            <CardDescription>Ratio Préventif vs Correctif.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-none">
        <CardHeader>
          <CardTitle>Disponibilité Globale des Équipements</CardTitle>
          <CardDescription>Taux de service mensuel combiné de toutes les cliniques.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              {m: 'Jan', v: 97}, {m: 'Fév', v: 98}, {m: 'Mar', v: 96}, 
              {m: 'Avr', v: 98.5}, {m: 'Mai', v: 97.8}, {m: 'Juin', v: 98.2}
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="m" axisLine={false} tickLine={false} />
              <YAxis domain={[90, 100]} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;