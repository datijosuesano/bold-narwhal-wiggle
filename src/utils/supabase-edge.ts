import { supabase } from "@/integrations/supabase/client";

/**
 * Call a secure Edge Function that performs sensitive operations
 * @param functionName Name of the Edge Function
 * @param body Request body to send to the function
 * @returns Response from the Edge Function
 */
export const callSecureFunction = async (functionName: string, body?: any) => {
  try {
    // Get the user's access token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Call the Edge Function with the user's token
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

/**
 * Example function to fetch sensitive data through a secure Edge Function
 */
export const fetchSensitiveData = async () => {
  return await callSecureFunction('secure-data-operation');
};