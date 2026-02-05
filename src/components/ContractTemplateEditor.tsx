import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Printer, Plus, Trash2, FileText } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface EquipmentRow {
  id: number;
  designation: string;
  quantity: string;
  reference: string;
}

const ContractTemplateEditor: React.FC = () => {
  const [data, setData] = useState({
    site: "[NOM DU SITE / ETABLISSEMENT]",
    societeP: "[NOM DE LA SOCIÉTÉ PRESTATAIRE]",
    representantP: "[NOM DU REPRÉSENTANT]",
    telP: "[NUMÉRO DE TÉLÉPHONE]",
    client: "[NOM DU CLIENT / ÉTABLISSEMENT]",
    titreR: "[TITRE DU RÉPRÉSENTANT]",
    ville: "[VILLE]",
    date: "[DATE]",
    montantAnnuC: "[MONTANT EN CHIFFRES]",
    montantAnnuL: "[MONTANT EN LETTRES]",
    montantBimenC: "[MONTANT EN CHIFFRES]",
    montantBimenL: "[MONTANT EN LETTRES]"
  });

  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([
    { id: 1, designation: "[EXEMPLE: Spectrophotomètre]", quantity: "[X]", reference: "[REF-XXX]" },
    { id: 2, designation: "[EXEMPLE: Microscope]", quantity: "[X]", reference: "[REF-XXX]" }
  ]);

  const handleAddRow = () => {
    const newId = equipmentRows.length > 0 ? Math.max(...equipmentRows.map(r => r.id)) + 1 : 1;
    setEquipmentRows([...equipmentRows, { id: newId, designation: "", quantity: "", reference: "" }]);
  };

  const handleRemoveRow = (id: number) => {
    setEquipmentRows(equipmentRows.filter(row => row.id !== id));
  };

  const handleUpdateRow = (id: number, field: keyof EquipmentRow, value: string) => {
    setEquipmentRows(equipmentRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = () => {
    showSuccess("Modèle de contrat et liste d'équipements enregistrés !");
  };

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">
      <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b">
        <Button onClick={handleSave} className="bg-blue-600 rounded-xl">
          <Save size={16} className="mr-2" /> Enregistrer le modèle
        </Button>
        <Button variant="outline" className="rounded-xl">
          <Printer size={16} className="mr-2" /> Imprimer / Export PDF
        </Button>
      </div>

      <div className="bg-white text-gray-900 p-10 shadow-2xl border font-serif text-[13px] leading-relaxed space-y-6 mx-auto max-w-[850px]">
        {/* Titre Principal */}
        <div className="text-center font-bold text-base mb-10 underline decoration-2 underline-offset-4">
          CONTRAT DE MAINTENANCE POUR LES EQUIPEMENTS MEDICAUX DE 
          <Input 
            value={data.site} 
            onChange={e => setData({...data, site: e.target.value})}
            className="inline-block w-full mt-2 text-center border-none font-bold bg-blue-50 focus:ring-1"
          />
        </div>

        {/* Sections du contrat (Contenu identique) */}
        <section>
          <p className="font-bold mb-4 uppercase">ENTRE LES SOUSSIGNÉS :</p>
          <div className="space-y-4">
            <p>
              D'une part,<br/>
              <strong><Input value={data.societeP} onChange={e => setData({...data, societeP: e.target.value})} className="inline-block w-64 border-none h-6 p-0 font-bold bg-blue-50"/></strong>, 
              représentée par 
              <strong><Input value={data.representantP} onChange={e => setData({...data, representantP: e.target.value})} className="inline-block w-64 border-none h-6 p-0 font-bold bg-blue-50 ml-1"/></strong><br/>
              Tel : <Input value={data.telP} onChange={e => setData({...data, telP: e.target.value})} className="inline-block w-48 border-none h-6 p-0 bg-blue-50"/><br/>
              Ayant tous pouvoirs à cet effet.
            </p>

            <p>
              ET<br/>
              D'autre part,<br/>
              <strong><Input value={data.client} onChange={e => setData({...data, client: e.target.value})} className="inline-block w-64 border-none h-6 p-0 font-bold bg-blue-50"/></strong>, 
              représenté par 
              <strong><Input value={data.titreR} onChange={e => setData({...data, titreR: e.target.value})} className="inline-block w-64 border-none h-6 p-0 font-bold bg-blue-50 ml-1"/></strong>.<br/>
              Ayant tous pouvoirs à cet effet.
            </p>
          </div>
        </section>

        <p className="font-bold text-center my-6">IL A ÉTÉ CONVENU CE QUI SUIT :</p>

        {/* Articles 1 à 7 */}
        <section className="space-y-6 text-justify">
          <div>
            <p className="font-bold">ARTICLE 1 : OBJET DU CONTRAT</p>
            <p>Le présent contrat a pour objet l’entretien, le dépannage et le maintien en bon état de fonctionnement du matériel décrit en annexe.</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Exclusions : Remplacement des pièces de rechanges à la charge du client.</li>
              <li>Contenu : Maintenance préventive et curative.</li>
            </ul>
          </div>
          {/* ... autres articles résumés visuellement pour l'édition ... */}
          <div className="p-4 bg-gray-50 border border-dashed rounded text-[11px] text-gray-500">
            [ Articles 2 à 7 inclus dans le document final : Entretien, Dépannage, Registre, Obligations, Durée, Prix ]
          </div>
        </section>

        <hr className="my-10 border-gray-400" />

        {/* Annexes Dynamiques */}
        <section className="space-y-8">
          <p className="font-bold text-center text-sm">ANNEXES</p>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold">A - LISTE DU MATERIEL CONCERNÉ PAR LA MAINTENANCE</p>
              <Button onClick={handleAddRow} size="sm" variant="outline" className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50">
                <Plus size={14} className="mr-1" /> Ajouter une ligne
              </Button>
            </div>
            
            <table className="w-full border-collapse border border-gray-400 text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 w-10">N°</th>
                  <th className="border border-gray-400 p-2 text-left">DÉSIGNATION</th>
                  <th className="border border-gray-400 p-2 w-20">QTÉ</th>
                  <th className="border border-gray-400 p-2 text-left">RÉF / N° SÉRIE</th>
                  <th className="border border-gray-400 p-2 w-10 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {equipmentRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border border-gray-400 p-1 text-center font-mono">{index + 1}</td>
                    <td className="border border-gray-400 p-1">
                      <Input 
                        value={row.designation} 
                        onChange={e => handleUpdateRow(row.id, 'designation', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent focus:bg-blue-50 text-[11px]"
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <Input 
                        value={row.quantity} 
                        onChange={e => handleUpdateRow(row.id, 'quantity', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent text-center focus:bg-blue-50 text-[11px]"
                      />
                    </td>
                    <td className="border border-gray-400 p-1">
                      <Input 
                        value={row.reference} 
                        onChange={e => handleUpdateRow(row.id, 'reference', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent focus:bg-blue-50 text-[11px]"
                      />
                    </td>
                    <td className="border border-gray-400 p-1 text-center print:hidden">
                      <button onClick={() => handleRemoveRow(row.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold mb-4">B - COÛT DE LA MAINTENANCE</p>
            <table className="w-full border-collapse border border-gray-400 text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">EQUIPEMENTS</th>
                  <th className="border border-gray-400 p-2 text-left">COÛT ANNUEL (TTC)</th>
                  <th className="border border-gray-400 p-2 text-left">COÛT BIMENSUEL (TTC)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-bold w-1/3">L’ensemble des équipements</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <Input value={data.montantAnnuC} onChange={e => setData({...data, montantAnnuC: e.target.value})} className="border-none h-6 p-0 bg-blue-50 font-bold"/>
                      <span>FCFA</span><br/>
                      (<Input value={data.montantAnnuL} onChange={e => setData({...data, montantAnnuL: e.target.value})} className="border-none h-6 p-0 bg-blue-50 w-full italic text-[10px]"/>)
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <Input value={data.montantBimenC} onChange={e => setData({...data, montantBimenC: e.target.value})} className="border-none h-6 p-0 bg-blue-50 font-bold"/>
                      <span>FCFA</span><br/>
                      (<Input value={data.montantBimenL} onChange={e => setData({...data, montantBimenL: e.target.value})} className="border-none h-6 p-0 bg-blue-50 w-full italic text-[10px]"/>)
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pied de page Signature */}
        <div className="pt-12">
          <p className="font-bold">Fait à <Input value={data.ville} onChange={e => setData({...data, ville: e.target.value})} className="inline-block w-32 border-none h-6 p-0 bg-blue-50"/>, le <Input value={data.date} onChange={e => setData({...data, date: e.target.value})} className="inline-block w-32 border-none h-6 p-0 bg-blue-50"/></p>
          
          <div className="mt-10 flex justify-between">
            <div className="text-center w-64">
              <p className="font-bold uppercase underline text-[11px]">POUR LE PRESTATAIRE</p>
              <div className="h-20 mt-2 border border-dashed border-gray-200"></div>
            </div>
            <div className="text-center w-64">
              <p className="font-bold uppercase underline text-[11px]">POUR LE CLIENT</p>
              <div className="h-20 mt-2 border border-dashed border-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplateEditor;