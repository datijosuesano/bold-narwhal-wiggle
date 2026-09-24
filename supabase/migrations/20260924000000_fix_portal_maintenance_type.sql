-- Repair the portal reader for existing databases: the maintenance type is
-- stored in French in maintenance_type_enum.
CREATE OR REPLACE FUNCTION public.get_portal_data(access_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_asset_id uuid;
  payload jsonb;
BEGIN
  SELECT asset_id INTO resolved_asset_id
  FROM public.portal_access_tokens
  WHERE token::text = access_token AND active = true
  LIMIT 1;

  IF resolved_asset_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.portal_access_tokens
  SET last_accessed_at = now()
  WHERE token::text = access_token AND active = true;

  SELECT jsonb_build_object(
    'asset', jsonb_build_object(
      'id', a.id, 'name', a.name, 'category', a.category, 'location', a.location,
      'status', a.status, 'serial_number', a.serial_number, 'model', a.model,
      'manufacturer', a.manufacturer, 'commissioning_date', a.commissioning_date,
      'description', a.description, 'image_url', to_jsonb(a)->>'image_url'
    ),
    'contract', (
      SELECT jsonb_build_object('name', c.name, 'provider', c.provider, 'start_date', c.start_date, 'end_date', c.end_date)
      FROM public.contracts c
      WHERE to_jsonb(c)->>'clinic' = a.location AND COALESCE(to_jsonb(c)->>'status', 'Active') = 'Active'
      ORDER BY c.created_at DESC LIMIT 1
    ),
    'last_maintenance', (
      SELECT jsonb_build_object('title', i.title, 'intervention_date', i.intervention_date, 'maintenance_type', i.maintenance_type, 'description', COALESCE(to_jsonb(i)->>'description', to_jsonb(i)->>'work_details'))
      FROM public.interventions i
      WHERE i.asset_id = a.id AND i.maintenance_type = 'Préventive'
      ORDER BY i.intervention_date DESC LIMIT 1
    ),
    'next_maintenance', (
      SELECT jsonb_build_object('title', w.title, 'due_date', w.due_date, 'maintenance_type', w.maintenance_type, 'status', w.status)
      FROM public.work_orders w
      WHERE w.asset_id = a.id AND w.maintenance_type = 'Préventive' AND w.status = 'Ouvert'
      ORDER BY w.due_date ASC LIMIT 1
    ),
    'work_orders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', w.id, 'title', w.title, 'due_date', w.due_date, 'maintenance_type', w.maintenance_type, 'status', w.status, 'description', w.description) ORDER BY w.due_date DESC)
      FROM public.work_orders w WHERE w.asset_id = a.id
    ), '[]'::jsonb),
    'interventions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'intervention_date', i.intervention_date, 'maintenance_type', i.maintenance_type, 'description', COALESCE(to_jsonb(i)->>'description', to_jsonb(i)->>'work_details')) ORDER BY i.intervention_date DESC)
      FROM public.interventions i WHERE i.asset_id = a.id
    ), '[]'::jsonb),
    'recent_breakdowns', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', w.id, 'title', w.title, 'created_at', w.created_at, 'status', w.status, 'reporter_name', 'Utilisateur du site') ORDER BY w.created_at DESC)
      FROM public.work_orders w
      WHERE w.asset_id = a.id AND to_jsonb(w)->>'reporter_name' IS NOT NULL
    ), '[]'::jsonb)
  ) INTO payload
  FROM public.assets a WHERE a.id = resolved_asset_id;

  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_portal_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_data(text) TO anon, authenticated;
