import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAssetFormProps {
  onSuccess?: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Non classé');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'Opérationnel' | 'En maintenance' | 'En panne'>('Opérationnel');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [commissioningDate, setCommissioningDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("Le nom de l'équipement est obligatoire");
      return;
    }

    if (!user?.id) {
      showError("Utilisateur non identifié");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('assets')
      .insert([{
        user_id: user.id,
        name,
        category,
        location,
        status,
        serial_number: serialNumber,
        model,
        manufacturer,
        commissioning_date: commissioningDate || null,
        purchase_cost: purchaseCost,
        description
      }]);

    setIsSubmitting(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Équipement ajouté avec succès !");
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-4">
      <Input placeholder="Nom de l'équipement" value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder="Catégorie" value={category} onChange={e => setCategory(e.target.value)} />
      <Input placeholder="Localisation" value={location} onChange={e => setLocation(e.target.value)} />
      <Select value={status} onValueChange={v => setStatus(v as any)}>
        <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Opérationnel">Opérationnel</SelectItem>
          <SelectItem value="En maintenance">En maintenance</SelectItem>
          <SelectItem value="En panne">En panne</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Numéro de série" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
      <Input placeholder="Modèle" value={model} onChange={e => setModel(e.target.value)} />
      <Input placeholder="Fabricant" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
      <Input type="date" placeholder="Date de mise en service" value={commissioningDate} onChange={e => setCommissioningDate(e.target.value)} />
      <Input type="number" placeholder="Coût d'achat" value={purchaseCost} onChange={e => setPurchaseCost(Number(e.target.value))} />
      <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
      </Button>
    </div>
  );
};

export default CreateAssetForm;
