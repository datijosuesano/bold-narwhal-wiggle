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

    const { recordId, tableName } = await req.json()
    if (!recordId || !tableName) throw new Error('Record ID and Table Name are required')

    // Fetch the record to get the file_url and verify ownership
    const { data: record, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('user_id, file_url')
      .eq('id', recordId)
      .single()

    if (fetchError || !record) throw new Error('Record not found')

    // Security Check: Verify user is admin OR owns the record pointing to this file
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    
    const isAuthorized = profile?.role === 'admin' || record.user_id === user.id

    if (!isAuthorized) throw new Error('Unauthorized to delete this file')

    // If it's not a storage file (e.g. external link), just return success
    if (!record.file_url || !record.file_url.includes('supabase.co/storage')) {
      return new Response(JSON.stringify({ success: true, message: 'Not a storage file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Extract path and bucket from file_url
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const url = new URL(record.file_url)
    const pathParts = url.pathname.split('/')
    const bucket = pathParts[5]
    const path = pathParts.slice(6).join('/')

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