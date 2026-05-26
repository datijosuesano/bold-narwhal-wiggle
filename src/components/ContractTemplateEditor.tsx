import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Printer, Plus, Trash2, FileText, CheckCircle2, Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface EquipmentRow {
  id: number;
  designation: string;
  quantity: string;
  reference: string;
  state: string;
}

const ContractTemplateEditor: React.FC = () => {
  const [data, setData] = useState({
    site: "CSU-COM DE GONZAGUEVILLE",
    societeP: "BIOPULSE SERVICES",
    representantP: "M. KOFFI KOUASSI (Directeur Technique)",
    telP: "01 52 52 28 31",
    client: "CSU-COM DE GONZAGUEVILLE",
    representantC: "Dr. BAMBA AMARA (Médecin Chef)",
    ville: "Port-Bouët, Abidjan",
    date: new Date().toLocaleDateString('fr-FR'),
    montantAnnuC: "1 800 000",
    montantAnnuL: "Un million huit cent mille",
    montantBimenC: "300 000",
    montantBimenL: "Trois cent mille",
    visitesAnnuelles: "6", // Visites de maintenance préventive
  });

  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([
    { id: 1, designation: "Spectrophotomètre de paillasse", quantity: "1", reference: "SP-99238-X", state: "Opérationnel" },
    { id: 2, designation: "Automate d'hématologie Sysmex", quantity: "1", reference: "SY-88291-A", state: "Opérationnel" },
    { id: 3, designation: "Autoclave vertical 50L", quantity: "1", reference: "AV-11202-B", state: "En maintenance" },
    { id: 4, designation: "Scialytique de bloc opératoire", quantity: "2", reference: "SC-44012-P", state: "Opérationnel" }
  ]);

  const handleAddRow = () => {
    const newId = equipmentRows.length > 0 ? Math.max(...equipmentRows.map(r => r.id)) + 1 : 1;
    setEquipmentRows([...equipmentRows, { id: newId, designation: "", quantity: "1", reference: "", state: "Bon" }]);
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
    showSuccess("Modèle de contrat et liste d'équipements enregistrés avec succès !");
  };

  const handleExportPDF = () => {
    showSuccess("Astuce : Choisissez 'Enregistrer au format PDF' dans l'onglet Destination de la fenêtre d'impression.");
    setTimeout(() => {
      window.print();
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">
      {/* Conteneur d'action - Masqué lors de l'impression */}
      <div className="flex justify-between items-center gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-3 border-b print:hidden">
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <CheckCircle2 size={14} className="text-blue-600" /> Les bordures d'édition bleues disparaissent à l'impression.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <Save size={16} className="mr-2" /> Enregistrer
          </Button>
          <Button onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white">
            <Download size={16} className="mr-2" /> Exporter PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200">
            <Printer size={16} className="mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      {/* ZONE DU CONTRAT FORMAT APERÇU PAPIER */}
      <div className="bg-white text-slate-900 p-8 md:p-12 shadow-2xl border font-serif text-[12px] leading-relaxed space-y-6 mx-auto max-w-[800px] print:shadow-none print:border-none print:p-0 print:text-black print:mx-0">
        
        {/* En-tête du document */}
        <div className="text-center space-y-4">
          <h1 className="font-extrabold text-[15px] underline decoration-2 underline-offset-4 uppercase tracking-wider text-center">
            CONTRAT DE MAINTENANCE PREVENTIVE ET CORRECTIVE
          </h1>
          <p className="font-bold text-[13px] uppercase">
            DES EQUIPEMENTS MEDICAUX ET BIOMEDICAUX DU :
          </p>
          <div className="max-w-md mx-auto">
            <Input 
              value={data.site} 
              onChange={e => setData({...data, site: e.target.value})}
              className="text-center border-none border-b border-dashed border-blue-200 font-bold bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded p-1 text-[13px] print:bg-transparent print:border-none print:p-0 print:font-black"
            />
          </div>
        </div>

        <hr className="border-slate-300 print:border-black" />

        {/* Identification des parties */}
        <section className="space-y-4">
          <h2 className="font-bold text-[13px] uppercase tracking-wide">ENTRE LES SOUSSIGNÉS :</h2>
          
          <div className="space-y-4 pl-4 text-justify">
            <div>
              <p>
                D’une part, la société prestataire de services dénommée :
              </p>
              <div className="flex gap-2 items-center mt-1">
                <strong>
                  <Input 
                    value={data.societeP} 
                    onChange={e => setData({...data, societeP: e.target.value})} 
                    className="border-none border-b border-dashed border-blue-200 h-6 p-1 font-bold bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded print:bg-transparent print:border-none print:p-0 print:font-bold"
                  />
                </strong>
              </div>
              <p className="mt-1">
                Représentée par : 
                <Input 
                  value={data.representantP} 
                  onChange={e => setData({...data, representantP: e.target.value})} 
                  className="inline-block w-80 border-none border-b border-dashed border-blue-200 h-6 p-1 bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded ml-1 print:bg-transparent print:border-none print:p-0 print:font-bold"
                />
              </p>
              <p>
                Téléphone de contact d'urgence : 
                <Input 
                  value={data.telP} 
                  onChange={e => setData({...data, telP: e.target.value})} 
                  className="inline-block w-48 border-none border-b border-dashed border-blue-200 h-6 p-1 bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded ml-1 print:bg-transparent print:border-none print:p-0"
                />
              </p>
              <p className="italic text-slate-500 print:hidden text-[10px]">Ci-après désigné "Le Prestataire".</p>
            </div>

            <div>
              <p>
                D’autre part, l'établissement sanitaire bénéficiaire désigné :
              </p>
              <div className="flex gap-2 items-center mt-1">
                <strong>
                  <Input 
                    value={data.client} 
                    onChange={e => setData({...data, client: e.target.value})} 
                    className="border-none border-b border-dashed border-blue-200 h-6 p-1 font-bold bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded print:bg-transparent print:border-none print:p-0 print:font-bold"
                  />
                </strong>
              </div>
              <p className="mt-1">
                Représenté par son responsable légal : 
                <Input 
                  value={data.representantC} 
                  onChange={e => setData({...data, representantC: e.target.value})} 
                  className="inline-block w-80 border-none border-b border-dashed border-blue-200 h-6 p-1 bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded ml-1 print:bg-transparent print:border-none print:p-0 print:font-bold"
                />
              </p>
              <p className="italic text-slate-500 print:hidden text-[10px]">Ci-après désigné "Le Client" ou "L'Établissement".</p>
            </div>
          </div>
        </section>

        <p className="font-bold text-center py-4 uppercase">IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</p>

        {/* Corps des Clauses et Articles Officiels */}
        <section className="space-y-6 text-justify">
          
          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 1 : OBJET DU CONTRAT</h3>
            <p className="mt-1">
              Le présent contrat a pour objet d’assurer la maintenance technique préventive et corrective de l’ensemble des équipements médicaux et biomédicaux du Client, tels que détaillés et répertoriés dans l’Annexe A du présent contrat.
            </p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 2 : PRESTATIONS DE MAINTENANCE PRÉVENTIVE</h3>
            <p className="mt-1">
              Le prestataire s'engage à effectuer 
              <Input 
                value={data.visitesAnnuelles} 
                onChange={e => setData({...data, visitesAnnuelles: e.target.value})} 
                className="inline-block w-12 text-center border-none border-b border-dashed border-blue-200 h-5 p-0 font-bold bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded print:bg-transparent print:border-none print:p-0 print:font-black"
              /> 
              visites de maintenance préventive par an (soit une visite tous les deux mois). 
              Ces visites comprennent le nettoyage interne, la lubrification, l’étalonnage, la vérification des paramètres de sécurité électrique et fonctionnelle, ainsi que le remplacement des petites pièces d'usure courante.
            </p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 3 : MAINTENANCE CORRECTIVE (DEPANNAGE)</h3>
            <p className="mt-1">
              En cas de panne d’un équipement sous contrat, le Client s’engage à le signaler sans délai via le portail ou par appel téléphonique. 
              Le Prestataire s’engage à intervenir sur site dans un délai maximal de <strong>24 heures ouvrées</strong> pour les urgences vitales, et sous <strong>48 heures ouvrées</strong> pour les pannes standards.
            </p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 4 : PIÈCES DE RECHANGE</h3>
            <p className="mt-1">
              Le coût des pièces de rechange nécessaires aux réparations correctives n'est pas inclus dans le montant forfaitaire du présent contrat. 
              Toute pièce défectueuse à remplacer fera l'objet d'un devis préalable soumis à l’approbation écrite du Client avant exécution des travaux.
            </p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 5 : OBLIGATIONS DU CLIENT</h3>
            <p className="mt-1">
              Le Client s'engage à faciliter l'accès des techniciens du Prestataire aux locaux d’installation des équipements et à veiller à ce que ces derniers soient utilisés conformément aux prescriptions d’utilisation des constructeurs.
            </p>
          </div>

          <div>
            <h3 className="font-bold border-b pb-1 uppercase">ARTICLE 6 : DURÉE DU CONTRAT</h3>
            <p className="mt-1">
              Le présent contrat est conclu pour une durée ferme de <strong>un (1) an</strong> à compter de sa date de signature. Il est renouvelable par tacite reconduction d'année en année, sauf dénonciation par l'une des parties par lettre recommandée avec accusé de réception au moins deux (2) mois avant son échéance.
            </p>
          </div>

        </section>

        {/* Saut de page lors de l'impression pour les annexes */}
        <div className="page-break print:break-before-page pt-10" />

        <hr className="my-10 border-slate-400 print:border-black" />

        {/* Annexes */}
        <section className="space-y-8">
          <h2 className="font-bold text-center text-sm underline decoration-1 uppercase">ANNEXES AU CONTRAT</h2>
          
          {/* Annexe A: Liste du matériel */}
          <div>
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="font-bold uppercase">A - LISTE DES EQUIPEMENTS COUVERTS</p>
              <Button onClick={handleAddRow} size="sm" variant="outline" className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl">
                <Plus size={14} className="mr-1" /> Ajouter un Équipement
              </Button>
            </div>
            <p className="font-bold uppercase hidden print:block mb-2 text-slate-800">A - LISTE DES EQUIPEMENTS COUVERTS PAR LE CONTRAT</p>
            
            <table className="w-full border-collapse border border-slate-400 text-[11px] print:border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-slate-400 p-2 w-10 text-center print:border-black">N°</th>
                  <th className="border border-slate-400 p-2 text-left print:border-black">DÉSIGNATION DES APPAREILS</th>
                  <th className="border border-slate-400 p-2 w-16 text-center print:border-black">QTÉ</th>
                  <th className="border border-slate-400 p-2 text-left print:border-black">NUMÉRO DE SÉRIE / RÉFÉRENCE</th>
                  <th className="border border-slate-400 p-2 w-24 text-center print:border-black">ÉTAT INITIAL</th>
                  <th className="border border-slate-400 p-2 w-10 text-center print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {equipmentRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="border border-slate-400 p-1 text-center font-mono print:border-black">{index + 1}</td>
                    <td className="border border-slate-400 p-1 print:border-black">
                      <Input 
                        value={row.designation} 
                        onChange={e => handleUpdateRow(row.id, 'designation', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent focus:bg-blue-50 text-[11px] rounded print:p-0"
                      />
                    </td>
                    <td className="border border-slate-400 p-1 print:border-black">
                      <Input 
                        value={row.quantity} 
                        onChange={e => handleUpdateRow(row.id, 'quantity', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent text-center focus:bg-blue-50 text-[11px] rounded print:p-0"
                      />
                    </td>
                    <td className="border border-slate-400 p-1 print:border-black">
                      <Input 
                        value={row.reference} 
                        onChange={e => handleUpdateRow(row.id, 'reference', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent focus:bg-blue-50 text-[11px] rounded font-mono print:p-0"
                      />
                    </td>
                    <td className="border border-slate-400 p-1 print:border-black">
                      <Input 
                        value={row.state} 
                        onChange={e => handleUpdateRow(row.id, 'state', e.target.value)}
                        className="border-none h-6 p-1 bg-transparent text-center focus:bg-blue-50 text-[11px] rounded print:p-0"
                      />
                    </td>
                    <td className="border border-slate-400 p-1 text-center print:hidden">
                      <button onClick={() => handleRemoveRow(row.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Annexe B: Tarification */}
          <div>
            <p className="font-bold mb-4 uppercase">B - BUDGET ET COÛT DE LA PRESTATION (TTC)</p>
            <table className="w-full border-collapse border border-slate-400 text-[11px] print:border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-slate-400 p-2 text-left print:border-black">SERVICES COMPRIS</th>
                  <th className="border border-slate-400 p-2 text-left print:border-black">REDÉVANCE ANNUELLE TTC</th>
                  <th className="border border-slate-400 p-2 text-left print:border-black">MODALITÉ DE PAIEMENT BIMESTRIELLE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold w-1/3 print:border-black">
                    L’ensemble des visites de maintenance préventive bi-mensuelles et interventions correctives illimitées.
                  </td>
                  <td className="border border-slate-400 p-2 print:border-black">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Input 
                          value={data.montantAnnuC} 
                          onChange={e => setData({...data, montantAnnuC: e.target.value})} 
                          className="border-none border-b border-dashed border-blue-200 h-6 p-1 font-bold bg-blue-50/40 hover:bg-blue-50 w-24 text-right rounded print:bg-transparent print:border-none print:p-0 print:font-bold"
                        />
                        <span>FCFA</span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic leading-none mt-1">
                        Soit en lettres :<br />
                        <Input 
                          value={data.montantAnnuL} 
                          onChange={e => setData({...data, montantAnnuL: e.target.value})} 
                          className="border-none border-b border-dashed border-blue-200 h-5 p-0 bg-blue-50/40 hover:bg-blue-50 w-full italic text-[10px] rounded print:bg-transparent print:border-none print:p-0"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-400 p-2 print:border-black">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Input 
                          value={data.montantBimenC} 
                          onChange={e => setData({...data, montantBimenC: e.target.value})} 
                          className="border-none border-b border-dashed border-blue-200 h-6 p-1 font-bold bg-blue-50/40 hover:bg-blue-50 w-24 text-right rounded print:bg-transparent print:border-none print:p-0 print:font-bold"
                        />
                        <span>FCFA</span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic leading-none mt-1">
                        Soit en lettres :<br />
                        <Input 
                          value={data.montantBimenL} 
                          onChange={e => setData({...data, montantBimenL: e.target.value})} 
                          className="border-none border-b border-dashed border-blue-200 h-5 p-0 bg-blue-50/40 hover:bg-blue-50 w-full italic text-[10px] rounded print:bg-transparent print:border-none print:p-0"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pied de page et Signatures */}
        <div className="pt-12 space-y-8">
          <p className="font-medium text-slate-800">
            Fait à : 
            <Input 
              value={data.ville} 
              onChange={e => setData({...data, ville: e.target.value})} 
              className="inline-block w-40 border-none border-b border-dashed border-blue-200 h-6 p-1 bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded ml-1 print:bg-transparent print:border-none print:p-0 print:font-bold"
            />
            , le 
            <Input 
              value={data.date} 
              onChange={e => setData({...data, date: e.target.value})} 
              className="inline-block w-32 border-none border-b border-dashed border-blue-200 h-6 p-1 bg-blue-50/40 hover:bg-blue-50 focus:bg-transparent focus:border-blue-500 rounded ml-1 print:bg-transparent print:border-none print:p-0 print:font-bold"
            />
          </p>
          
          <div className="mt-12 flex justify-between gap-8">
            <div className="text-center w-1/2">
              <p className="font-bold uppercase underline text-[10px] tracking-wider">POUR LE PRESTATAIRE (Mention "Lu et approuvé")</p>
              <div className="h-24 mt-3 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[10px] italic print:border-black print:text-black print:font-bold print:border-2">
                Cachet, Signature et Date
              </div>
            </div>
            <div className="text-center w-1/2">
              <p className="font-bold uppercase underline text-[10px] tracking-wider">POUR LE CLIENT (Mention "Lu et approuvé")</p>
              <div className="h-24 mt-3 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[10px] italic print:border-black print:text-black print:font-bold print:border-2">
                Cachet, Signature et Date
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Règle CSS d'impression dédiée - Injectée localement pour s'assurer qu'elle l'emporte */}
      <style>{`
        @media print {
          /* Cacher toute l'application sauf la zone du contrat */
          body * {
            visibility: hidden;
          }
          .print\\:hidden, button, header, nav, aside, footer {
            display: none !important;
          }
          /* Afficher la zone de contrat et ses descendants uniquement */
          .bg-white.text-slate-900.shadow-2xl {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white.text-slate-900.shadow-2xl * {
            visibility: visible;
          }
          /* Nettoyage des inputs d'édition à l'impression */
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            color: black !important;
            font-weight: bold !important;
          }
          /* Ajustements de mise en page papier */
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractTemplateEditor;