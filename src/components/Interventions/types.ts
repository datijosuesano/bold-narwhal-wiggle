/* =========================================================
   ASSETS
========================================================= */

export interface Asset {
  id: string;

  name: string;

  serial_number?: string | null;

  location?: string | null;

  category?: string | null;
}

/* =========================================================
   TECHNICIENS
========================================================= */

export interface Technician {
  id: string;

  first_name: string | null;

  last_name: string | null;

  full_name: string;

  email?: string | null;

  role?: string | null;
}

/* =========================================================
   PIECES DETACHEES
========================================================= */

export interface SparePart {
  id: string;

  name: string;

  reference?: string | null;

  current_stock: number;

  min_stock?: number;

  purchase_cost?: number;

  supplier?: string | null;

  location?: string | null;

  compatible_equipment?: string | null;

  created_at?: string;
}

/* =========================================================
   PIECES UTILISEES
========================================================= */

export interface InterventionPartInput {
  part_id: string;

  quantity: number;
}

export interface InterventionPart extends InterventionPartInput {
  id?: string;

  intervention_id?: string;
}

/* =========================================================
   DETAILS PIECES
========================================================= */

export interface InterventionPartDetails {
  id: string;

  intervention_id?: string;

  part_id: string;

  quantity: number;

  spare_parts?: SparePart;
}

/* =========================================================
   PIECES JOINTES
========================================================= */

export interface InterventionAttachment {
  id?: string;

  intervention_id: string;

  user_id?: string;

  file_name: string;

  file_url: string;

  file_type?: string;

  created_at?: string;
}

/* =========================================================
   INTERVENTION
========================================================= */

export interface Intervention {
  id?: string;

  user_id?: string;

  asset_id?: string;

  technician_id?: string;

  validated_by?: string;

  rit_number?: string;

  physical_rit_number?: string;

  title: string;

  description?: string;

  diagnosis?: string;

  work_performed?: string;

  recommendations?: string;

  maintenance_type?: string;

  intervention_status?: string;

  intervention_place?: string;

  intervention_date?: string;

  start_date?: string;

  end_date?: string;

  downtime_minutes?: number;

  accessories_received?: string;

  parts_replaced?: boolean;

  invoice_number?: string;

  invoice_status?: string;

  invoice_deposited_at?: string;

  total_cost?: number;

  client_signature_url?: string;

  created_at?: string;

  /* ==========================
     Relations Supabase
  ========================== */

  asset?: Asset | null;

  technician?: Technician | null;

  intervention_parts?: InterventionPartDetails[];
}

/* =========================================================
   CREATE
========================================================= */

export type InterventionCreateInput = Omit<
  Intervention,
  | "id"
  | "created_at"
  | "asset"
  | "technician"
  | "intervention_parts"
>;

/* =========================================================
   UPDATE
========================================================= */

export type InterventionUpdateInput =
  Partial<InterventionCreateInput>;

/* =========================================================
   SELECTED PART
========================================================= */

export interface SelectedPart {
  part_id: string;

  quantity: number;
}