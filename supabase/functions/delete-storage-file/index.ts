import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')
    if (authError || !user) throw new Error('Unauthorized')

    const { bucket, path, recordId, tableName } = await req.json()

    // Security Check: Verify user is admin OR owns the record pointing to this file
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    
    let isAuthorized = profile?.role === 'admin'

    if (!isAuthorized && recordId && tableName) {
      const { data: record } = await supabaseAdmin.from(tableName).select('user_id').eq('id', recordId).single()
      if (record?.user_id === user.id) isAuthorized = true
    }

    if (!isAuthorized) throw new Error('Unauthorized to delete this file')

    console.log(`[delete-storage-file] Deleting ${path} from ${bucket}`)

    const { error: storageError } = await supabaseAdmin.storage.from(bucket).remove([path])
    if (storageError) throw storageError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("[delete-storage-file] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})