import { supabase } from "@/integrations/supabase/client";

/**
 * Securely fetch data with proper user filtering
 * @param table Table name to query
 * @param userId Current user ID for filtering
 * @param selectFields Fields to select (defaults to '*')
 * @returns Filtered data for the authenticated user
 */
export const fetchUserData = async <T>(
  table: string,
  userId: string,
  selectFields: string = '*'
): Promise<T[]> => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .eq('user_id', userId);

    if (error) throw error;
    return data as T[];
  } catch (error) {
    console.error(`Error fetching ${table} data:`, error);
    throw error;
  }
};

/**
 * Securely insert data with user association
 * @param table Table name to insert into
 * @param userId Current user ID to associate with record
 * @param data Data to insert
 * @returns Insert result
 */
export const insertUserData = async <T>(
  table: string,
  userId: string,
  data: Partial<T>
): Promise<any> => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert({
        ...data,
        user_id: userId
      });

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error inserting ${table} data:`, error);
    throw error;
  }
};

/**
 * Securely update user data with ownership verification
 * @param table Table name to update
 * @param userId Current user ID for ownership verification
 * @param id Record ID to update
 * @param data Data to update
 * @returns Update result
 */
export const updateUserData = async <T>(
  table: string,
  userId: string,
  id: string,
  data: Partial<T>
): Promise<any> => {
  try {
    // First verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Record not found or unauthorized');
    }

    // Then perform update
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id);

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error updating ${table} data:`, error);
    throw error;
  }
};

/**
 * Securely delete user data with ownership verification
 * @param table Table name to delete from
 * @param userId Current user ID for ownership verification
 * @param id Record ID to delete
 * @returns Delete result
 */
export const deleteUserData = async (
  table: string,
  userId: string,
  id: string
): Promise<any> => {
  try {
    // First verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Record not found or unauthorized');
    }

    // Then perform deletion
    const { data: result, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error deleting ${table} data:`, error);
    throw error;
  }
};