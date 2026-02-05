import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Printer, FileText } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

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

  const handleSave = () => {
    showSuccess("Modèle de contrat enregistré !");
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

      <div className="bg-white text-gray-900 p-10 shadow-2xl border font-serif text-[13px] leading-relaxed space-y-6 mx-auto max-w-[800px]">
        {/* Titre Principal */}
        <div className="text-center font-bold text-base mb-10 underline decoration-2 underline-offset-4">
          CONTRAT DE MAINTENANCE POUR LES EQUIPEMENTS MEDICAUX DE 
          <Input 
            value={data.site} 
            onChange={e => setData({...data, site: e.target.value})}
            className="inline-block w-full mt-2 text-center border-none font-bold bg-blue-50 focus:ring-1"
          />
        </div>

        {/* Parties */}
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

        {/* Articles */}
        <section className="space-y-6 text-justify">
          <div>
            <p className="font-bold">ARTICLE 1 : OBJET DU CONTRAT</p>
            <p>Le présent contrat a pour objet l’entretien, le dépannage et le maintien en bon état de fonctionnement du matériel décrit en annexe.</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Exclusions :</strong> Il est précisé que cette assistance ne comprend pas le remplacement des pièces de rechanges (les pièces de rechanges sont à la charge du client).</li>
              <li><strong>Contenu du forfait :</strong> Le forfait comprend une maintenance préventive et curative.</li>
            </ul>
          </div>

          <div>
            <p className="font-bold">1.1 Maintenance préventive</p>
            <p>Elle consiste en une visite bimensuelle sur site afin de contrôler les équipements et leur bonne utilisation. Cette maintenance sera l'occasion de relever les dysfonctionnements du matériel et de révéler l’état des accessoires qui nécessitent d’être changés ou remplacés avant qu’une panne sérieuse n’advienne.</p>
          </div>

          <div>
            <p className="font-bold">1.2 Maintenance curative</p>
            <p>Elle sera appliquée dans la mesure où l’équipement présente des anomalies de fonctionnement ou lorsque la panne est de la responsabilité du client (problèmes d'alimentation électrique, panne d'onduleur, erreur d'exploitation...). Elle comprend :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>L'assistance téléphonique où le client suit les indications données par téléphone.</li>
              <li>L'intervention sur place pour le diagnostic et la réparation de toutes pannes matérielles (pièces de rechanges ne sont pas comprises dans ce forfait).</li>
            </ul>
          </div>

          <div>
            <p className="font-bold">ARTICLE 2 : ENTRETIEN</p>
            <p>Le technicien de maintenance assurera un contrôle périodique afin de vérifier la bonne marche du matériel et effectuera à cette occasion les opérations d'entretien courant éventuellement nécessaires.</p>
            <ul className="list-disc ml-6 mt-2">
              <li><strong>Périodicité des visites de contrôle :</strong> Chaque 2 mois.</li>
              <li>Un programme de maintenance préventive sera remis à {data.client}.</li>
            </ul>
          </div>

          <div>
            <p className="font-bold">ARTICLE 3 : DÉPANNAGE</p>
            <p>Sur appel motivé du client signalant une anomalie de fonctionnement ou une panne, {data.societeP} enverra une personne pour dépanner le matériel dans les délais les plus brefs. Une assistance téléphonique peut être proposée pour des problèmes jugés mineurs.</p>
          </div>

          <div>
            <p className="font-bold">ARTICLE 4 : REGISTRE DES ANOMALIES</p>
            <p>{data.client} devra tenir un registre sur lequel il devra consigner toutes les anomalies, incidents ou pannes concernant le matériel. Il devra, en outre, indiquer dans ce registre tous les faits ayant entraîné ou susceptibles d'entraîner une anomalie.</p>
          </div>

          <div>
            <p className="font-bold">ARTICLE 5 : OBLIGATIONS DES DIFFÉRENTES PARTIES</p>
            <p className="font-bold mt-2">5.1 Obligations de {data.client}</p>
            <p>S’engage à respecter les conditions normales d'utilisation du matériel et à appliquer strictement toutes les instructions transmises. Le matériel ne pourra être modifié, déplacé, réparé par des tiers sans l'autorisation préalable de {data.societeP}.</p>
            <p className="font-bold mt-2">5.2 Obligations de {data.societeP}</p>
            <p>L’entreprise a l’obligation de poser le diagnostic ou de résoudre le problème dans les 72 heures dès qu'elle est contactée par {data.client}.</p>
          </div>

          <div>
            <p className="font-bold">ARTICLE 6 : DURÉE DU CONTRAT</p>
            <p>Le présent contrat est conclu pour une durée d’un an à compter de la date de signature. Le présent contrat sera poursuivi par tacite reconduction par périodes d’un an sur accord préalable des parties.</p>
          </div>

          <div>
            <p className="font-bold">ARTICLE 7 : PRIX</p>
            <p>Le montant TTC de la maintenance telle que prévue dans le présent contrat est fixé dans l’annexe.</p>
          </div>
        </section>

        <hr className="my-10 border-gray-400" />

        {/* Annexes */}
        <section className="space-y-8">
          <p className="font-bold text-center text-sm">ANNEXES</p>
          
          <div>
            <p className="font-bold mb-4">A - LISTE DU MATERIEL CONCERNÉ PAR LA MAINTENANCE</p>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">N°</th>
                  <th className="border border-gray-400 p-2 text-left">DÉSIGNATION</th>
                  <th className="border border-gray-400 p-2 text-left">QUANTITÉ</th>
                  <th className="border border-gray-400 p-2 text-left">RÉFÉRENCE OU NUMÉRO DE SÉRIE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2">1</td>
                  <td className="border border-gray-400 p-2">[EXEMPLE: Spectrophotomètre]</td>
                  <td className="border border-gray-400 p-2">[X]</td>
                  <td className="border border-gray-400 p-2">[REF-XXX]</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2">2</td>
                  <td className="border border-gray-400 p-2">[EXEMPLE: Microscope]</td>
                  <td className="border border-gray-400 p-2">[X]</td>
                  <td className="border border-gray-400 p-2">[REF-XXX]</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold mb-4">B - COÛT DE LA MAINTENANCE</p>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">EQUIPEMENTS</th>
                  <th className="border border-gray-400 p-2 text-left">COÛT ANNUEL DE LA MAINTENANCE (TTC)</th>
                  <th className="border border-gray-400 p-2 text-left">COÛT BIMENSUEL DE LA MAINTENANCE (TTC)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-bold">L’ensemble des équipements</td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <Input value={data.montantAnnuC} onChange={e => setData({...data, montantAnnuC: e.target.value})} className="border-none h-6 p-0 bg-blue-50 font-bold"/>
                      <span>FCFA</span><br/>
                      (<Input value={data.montantAnnuL} onChange={e => setData({...data, montantAnnuL: e.target.value})} className="border-none h-6 p-0 bg-blue-50 w-full italic"/>)
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2">
                    <div className="space-y-1">
                      <Input value={data.montantBimenC} onChange={e => setData({...data, montantBimenC: e.target.value})} className="border-none h-6 p-0 bg-blue-50 font-bold"/>
                      <span>FCFA</span><br/>
                      (<Input value={data.montantBimenL} onChange={e => setData({...data, montantBimenL: e.target.value})} className="border-none h-6 p-0 bg-blue-50 w-full italic"/>)
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pied de page */}
        <div className="pt-12">
          <p className="font-bold">Fait à <Input value={data.ville} onChange={e => setData({...data, ville: e.target.value})} className="inline-block w-32 border-none h-6 p-0 bg-blue-50"/>, le <Input value={data.date} onChange={e => setData({...data, date: e.target.value})} className="inline-block w-32 border-none h-6 p-0 bg-blue-50"/></p>
          
          <div className="mt-10 flex justify-between">
            <div className="text-center w-64">
              <p className="font-bold uppercase underline">POUR {data.societeP}</p>
              <p className="text-[10px] italic mt-1">(Signature)</p>
              <div className="h-24 mt-2 border border-dashed border-gray-200"></div>
            </div>
            <div className="text-center w-64">
              <p className="font-bold uppercase underline">POUR {data.client}</p>
              <p className="text-[10px] italic mt-1">(Signature)</p>
              <div className="h-24 mt-2 border border-dashed border-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplateEditor;