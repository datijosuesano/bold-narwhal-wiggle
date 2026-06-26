// ... (garder tous tes imports en haut)

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  // ... (garder tous tes useState et useEffect)

  const onSubmit = async (data: z.infer<typeof InterventionSchema>) => {
    setIsLoading(true);

    // Vérification stock avant toute opération
    for (const item of selectedParts) {
      if (!item.partId) continue;
      const matchedPart = spareParts.find(p => p.id === item.partId);
      if (matchedPart && item.quantity > matchedPart.current_stock) {
        showError(`Stock insuffisant pour "${matchedPart.name}".`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        user_id: user?.id,
        technician_id: data.technician_id,
        asset_id: data.asset_id,
        rit_number: data.rit_number,
        title: data.title,
        description: data.description,
        maintenance_type: data.maintenance_type,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        intervention_date: new Date(data.start_date).toISOString().split('T')[0],
        total_cost: data.total_cost,
        client_signature_url: signatureUrl,
        intervention_place: data.intervention_place,
        accessories_received: data.accessories_received,
      };

      let interventionId = initialData?.id;

      if (initialData?.id) {
        // --- MODE MODIFICATION (UPDATE) ---
        const { error: updateError } = await supabase
          .from('interventions')
          .update(payload)
          .eq('id', initialData.id);
        
        if (updateError) throw updateError;
        showSuccess("Intervention mise à jour !");
      } else {
        // --- MODE CRÉATION (INSERT) ---
        const { data: newInv, error: insertError } = await supabase
          .from('interventions')
          .insert(payload)
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        interventionId = newInv.id;
        
        // Si on vient d'un Work Order, on le clôture
        if (initialData?.id) { // Si tu passes l'id du work_order dans initialData
             await supabase.from('work_orders').update({ 
               status: 'Terminé',
               intervention_id: interventionId 
             }).eq('id', initialData.id);
        }
        showSuccess("Intervention enregistrée !");
      }

      // Gestion des pièces (Suppression des anciennes pour re-créer les bonnes)
      if (interventionId) {
        await supabase.from('intervention_parts').delete().eq('intervention_id', interventionId);
        
        for (const item of selectedParts) {
          await supabase.from('intervention_parts').insert({
            intervention_id: interventionId,
            part_id: item.partId,
            quantity: item.quantity
          });
          // (Ajoute ici ta logique de décrémentation de stock comme avant)
        }
      }

      setSavedInterventionId(interventionId);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (le reste du return reste identique)