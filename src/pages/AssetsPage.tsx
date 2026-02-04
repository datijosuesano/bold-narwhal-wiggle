import React, { useState } from 'react';
import { Plus, Search, Eye, Edit2, MoreVertical, Filter, AlertCircle, CheckCircle2, Settings } from 'lucide-react';

const EquipmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Données fictives pour la démo
  const equipments = [
    { id: 'EQ-001', name: 'Compresseur Industriel V12', category: 'Production', location: 'Zone A', status: 'Opérationnel' },
    { id: 'EQ-002', name: 'Groupe Électrogène 500kVA', category: 'Énergie', location: 'Extérieur', status: 'Maintenance' },
    { id: 'EQ-003', name: 'Pompe Hydraulique P-45', category: 'Logistique', location: 'Zone C', status: 'En Panne' },
    { id: 'EQ-004', name: 'Convoyeur Principal', category: 'Production', location: 'Zone B', status: 'Opérationnel' },
    { id: 'EQ-005', name: 'Chariot Élévateur E-20', category: 'Logistique', location: 'Entrepôt', status: 'Opérationnel' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-100 text-green-700 border-green-200';
      case 'Maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'En Panne': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des équipements</h1>
          <p className="text-gray-500">Gérez et suivez l'état de votre parc matériel</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm">
          <Plus size={18} />
          <span>Ajouter Équipement</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Actifs', value: '124', icon: <Settings className="text-blue-600" />, color: 'border-blue-500' },
          { label: 'En Panne', value: '3', icon: <AlertCircle className="text-red-500" />, color: 'border-red-500' },
          { label: 'En Service', value: '118', icon: <CheckCircle2 className="text-green-500" />, color: 'border-green-500' }
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${kpi.color}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{kpi.value}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-full">{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un équipement..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <Filter size={18} />
              <span>Filtres</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Équipement</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Localisation</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipments.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentsPage;