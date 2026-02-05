import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Printer, FileEdit } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const ContractTemplateEditor: React.FC = () => {
  const [data, setData] = useState({
    site: "[SITE / ETABLISSEMENT]",
    prestataire: "[SOCIÉTÉ PRESTATAIRE]",
    representantP: "[REPRÉSENTANT PRESTATAIRE]",
    telP: "[NUMÉRO DE TÉLÉPHONE]",
    representantC: "[REPRÉSENTANT CLIENT]",
    titreC: "[TITRE DU RÉPRÉSENTANT]",
    ville: "Paris",
    date: new Date().toLocaleDateString(),
    montantAnnu: "0",
    montantBimen: "0"
  });

  const handleSave = () => {
    showSuccess("Modèle de contrat mis à jour !");
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
      <div className="flex justify-end gap-2 mb-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
        <Button onClick={handleSave} className="bg-blue-600 rounded-xl">
          <Save size={16} className="mr-2" /> Enregistrer
        </Button>
        <Button variant="outline" className="rounded-xl">
          <Printer size={16} className="mr-2" /> Imprimer
        </Button>
      </div>

      <div className="bg-white text-gray-900 p-8 shadow-inner border font-serif text-sm space-y-8">
        <div className="text-center font-bold text-lg mb-8">
          CONTRAT DE MAINTENANCE POUR LES EQUIPEMENTS MEDICAUX DE 
          <Input 
            value={data.site} 
            onChange={e => setData({...data, site: e.target.value})}
            className="inline-block w-64 ml-2 border-b border-t-0 border-x-0 rounded-none focus:ring-0 font-bold"
          />
        </div>

        <section>
          <div className="font-bold mb-2">ENTRE LES SOUSSIGNÉS :</div>
          <p className="mb-4">
            D'une part, <br/>
            <strong>
              <Input value={data.prestataire} onChange={e => setData({...data, prestataire: e.target.value})} className="inline-block w-48 border-none h-6 p-1"/>
            </strong>, 
            représentée par 
            <strong>
              <Input value={data.representantP} onChange={e => setData({...data, representantP: e.target.value})} className="inline-block w-48 border-none h-6 p-1"/>
            </strong><br/>
            Tel : <Input value={data.telP} onChange={e => setData({...data, telP: e.target.value})} className="inline-block w-32 border-none h-6 p-1"/><br/>
            Ayant tous pouvoirs à cet effet.
          </p>

          <p>
            ET D'autre part, <br/>
            <strong>
              <Input value={data.site} onChange={e => setData({...data, site: e.target.value})} className="inline-block w-48 border-none h-6 p-1"/>
            </strong>, 
            représenté par 
            <strong>
              <Input value={data.representantC} onChange={e => setData({...data, representantC: e.target.value})} className="inline-block w-48 border-none h-6 p-1"/>
            </strong>,
            <strong>
              <Input value={data.titreC} onChange={e => setData({...data, titreC: e.target.value})} className="inline-block w-48 border-none h-6 p-1"/>
            </strong>.<br/>
            Ayant tous pouvoirs à cet effet.
          </p>
        </section>

        <section className="space-y-4">
          <div><strong>ARTICLE 1 : OBJET DU CONTRAT</strong><br/>Le présent contrat a pour objet l’entretien, le dépannage et le maintien en bon état de fonctionnement du matériel décrit en annexe.</div>
          
          <div><strong>1.1 Maintenance préventive</strong><br/>Elle consiste en une visite bimensuelle sur site afin de contrôler les équipements et leur bonne utilisation...</div>
          
          <div><strong>ARTICLE 5 : OBLIGATIONS</strong><br/>L’entreprise a l’obligation de poser le diagnostic ou de résoudre le problème dans les 72 heures...</div>
        </section>

        <section className="pt-8 border-t">
          <div className="font-bold mb-4 uppercase">ANNEXE B - COÛT DE LA MAINTENANCE</div>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2">EQUIPEMENTS</th>
                <th className="border border-gray-400 p-2">COÛT ANNUEL (TTC)</th>
                <th className="border border-gray-400 p-2">COÛT BIMENSUEL (TTC)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2">L’ensemble des équipements</td>
                <td className="border border-gray-400 p-2 text-center">
                  <Input value={data.montantAnnu} onChange={e => setData({...data, montantAnnu: e.target.value})} className="w-full border-none p-0 text-center"/>
                </td>
                <td className="border border-gray-400 p-2 text-center">
                   <Input value={data.montantBimen} onChange={e => setData({...data, montantBimen: e.target.value})} className="w-full border-none p-0 text-center"/>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="pt-8 flex justify-between">
          <div className="text-center">
            <p className="font-bold">POUR LE PRESTATAIRE</p>
            <div className="h-20 w-32 border border-dashed border-gray-300 mx-auto mt-2"></div>
          </div>
          <div className="text-center">
            <p className="font-bold">POUR LE CLIENT</p>
            <div className="h-20 w-32 border border-dashed border-gray-300 mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplateEditor;