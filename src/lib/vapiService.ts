
import { Lead, CallStatus } from "@/types";
import { supabase } from './supabase/client';
import { incrementPhoneIdUsage, getNextAvailablePhoneId } from "./phoneUtils";

interface VapiCallParams {
  phoneNumber: string;
  name: string;
  phoneId: string;
  // Add any other parameters required by VAPI.AI
}

interface VapiCallResponse {
  callId: string;
  status: string;
  // Add other fields returned by VAPI.AI
}

export class VapiService {
  // Make an actual API call to VAPI.AI
  static async makeCall(
    lead: Lead,
    dailyLimit: number = 100
  ): Promise<Lead> {
    // Get next available phone ID
    const phoneId = await getNextAvailablePhoneId(dailyLimit);
    
    if (!phoneId) {
      throw new Error("No available phone IDs to make calls");
    }
    
    try {
      // Prepare the API call parameters
      const callParams: VapiCallParams = {
        phoneNumber: lead.phoneNumber,
        name: lead.name,
        phoneId
      };
      
      // Get the API key from environment variables
      const apiKey = import.meta.env.VITE_VAPI_API_KEY;
      
      if (!apiKey) {
        throw new Error("VAPI API key not found");
      }
      
      // Make the actual API call to VAPI.AI
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(callParams)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`VAPI API error: ${errorData.message || response.statusText}`);
      }
      
      const result: VapiCallResponse = await response.json();
      
      // Update phone ID usage in the database
      await incrementPhoneIdUsage(phoneId);
      
      // Update the lead with the call information
      const updatedLead: Lead = {
        ...lead,
        phoneId,
        status: CallStatus.IN_PROGRESS,
        updatedAt: new Date()
      };
      
      // Store the updated lead in Supabase
      const { error } = await supabase
        .from('leads')
        .upsert({
          id: updatedLead.id,
          name: updatedLead.name,
          phone_number: updatedLead.phoneNumber,
          phone_id: updatedLead.phoneId,
          status: updatedLead.status,
          disposition: updatedLead.disposition,
          duration: updatedLead.duration,
          cost: updatedLead.cost,
          created_at: updatedLead.createdAt.toISOString(),
          updated_at: updatedLead.updatedAt?.toISOString() || new Date().toISOString()
        }, { onConflict: 'id' });
        
      if (error) {
        console.error('Error updating lead in database:', error);
        throw new Error('Failed to update lead in database');
      }
      
      return updatedLead;
      
    } catch (error) {
      console.error("Error making VAPI call:", error);
      
      // Update the lead to failed status
      const updatedLead: Lead = {
        ...lead,
        status: CallStatus.FAILED,
        updatedAt: new Date()
      };
      
      // Store the failed lead in Supabase
      await supabase
        .from('leads')
        .upsert({
          id: updatedLead.id,
          name: updatedLead.name,
          phone_number: updatedLead.phoneNumber,
          status: updatedLead.status,
          updated_at: updatedLead.updatedAt?.toISOString() || new Date().toISOString()
        }, { onConflict: 'id' });
        
      throw error;
    }
  }
  
  // Update call statistics in the database
  static async updateCallStats(stats: {
    completedCalls: number;
    inProgressCalls: number;
    remainingCalls: number;
    failedCalls: number;
    totalMinutes: number;
    totalCost: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('call_stats')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001', // Use a fixed ID for the stats record
        completed_calls: stats.completedCalls,
        in_progress_calls: stats.inProgressCalls,
        remaining_calls: stats.remainingCalls,
        failed_calls: stats.failedCalls,
        total_minutes: stats.totalMinutes,
        total_cost: stats.totalCost,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (error) {
      console.error('Error updating call stats:', error);
      throw new Error('Failed to update call stats in database');
    }
  }
}
