
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    
    // Parse the request body
    const requestData = await req.json()
    
    // Basic validation of webhook data
    if (!requestData || !requestData.callId) {
      return new Response(JSON.stringify({ error: "Invalid webhook data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    
    // Destructure the webhook data
    const {
      callId,
      phoneId,
      status,
      disposition = null,
      duration = null,
      summary = null
    } = requestData
    
    console.log("Received webhook data:", requestData)
    
    // 1. Find the related lead using the phoneId
    const { data: leads, error: leadsError } = await supabaseClient
      .from("leads")
      .select("*")
      .eq("phone_id", phoneId)
      .eq("status", "In Progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      
    if (leadsError || !leads || leads.length === 0) {
      console.error("Error finding lead for webhook:", leadsError)
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    
    const lead = leads[0]
    
    // 2. Calculate cost ($0.99 per minute)
    const callDuration = duration ? parseFloat(duration) : 0
    const callCost = callDuration * 0.99
    
    // 3. Update the lead with the call information
    const { error: updateError } = await supabaseClient
      .from("leads")
      .update({
        status: status || "Completed",
        disposition: disposition,
        duration: callDuration,
        cost: callCost,
        updated_at: new Date().toISOString()
      })
      .eq("id", lead.id)
      
    if (updateError) {
      console.error("Error updating lead with webhook data:", updateError)
      return new Response(JSON.stringify({ error: "Failed to update lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    
    // 4. Update the call statistics
    // Get current stats
    const { data: statsData } = await supabaseClient
      .from("call_stats")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()
      
    if (statsData) {
      // Update the stats based on the call outcome
      let completedCalls = statsData.completed_calls
      let inProgressCalls = statsData.in_progress_calls
      let failedCalls = statsData.failed_calls
      
      if (status === "Completed") {
        completedCalls += 1
        inProgressCalls -= 1
      } else if (status === "Failed") {
        failedCalls += 1
        inProgressCalls -= 1
      }
      
      // Update the stats in the database
      await supabaseClient
        .from("call_stats")
        .update({
          completed_calls: completedCalls,
          in_progress_calls: inProgressCalls,
          failed_calls: failedCalls,
          total_minutes: statsData.total_minutes + callDuration,
          total_cost: statsData.total_cost + callCost,
          updated_at: new Date().toISOString()
        })
        .eq("id", "00000000-0000-0000-0000-000000000001")
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
    
  } catch (error) {
    console.error("Webhook processing error:", error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
