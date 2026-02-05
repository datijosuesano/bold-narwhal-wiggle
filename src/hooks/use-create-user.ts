import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './use-auth';

interface CreateUserPayload {
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
}

const EDGE_FUNCTION_URL = "https://gvwtsrxttnqsnpanjppk.supabase.co/functions/v1/create-user";

export const useCreateUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (payload: CreateUserPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("User must be authenticated to create new users.");
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create user via Edge Function.');
        return { success: false, error: result.error };
      }

      return { success: true, userId: result.userId };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { createUser, isLoading, error };
};