
import { Lead, CallStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from './supabase/client';

export const uploadLeads = async (file: File): Promise<Lead[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const leads = parseCSV(csv);
        
        // Save the leads to Supabase
        const { error } = await supabase.from('leads').insert(
          leads.map(lead => ({
            id: lead.id,
            name: lead.name,
            phone_number: lead.phoneNumber,
            status: lead.status,
            created_at: lead.createdAt.toISOString()
          }))
        );
        
        if (error) {
          console.error('Error saving leads to database:', error);
          reject(new Error('Failed to save leads to database'));
          return;
        }
        
        // For call stats management, we'll implement a client-side approach 
        // since the call_stats table may not be available yet
        try {
          // Attempt to update call stats but handle gracefully if table doesn't exist
          await updateCallStatsForNewLeads(leads.length);
        } catch (statsError) {
          console.warn('Could not update call stats, continuing:', statsError);
        }
        
        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading the file"));
    };
    
    reader.readAsText(file);
  });
};

const updateCallStatsForNewLeads = async (newLeadCount: number): Promise<void> => {
  try {
    // First try to fetch existing stats
    const { data } = await supabase
      .rpc('update_remaining_calls', { add_count: newLeadCount })
      .single();
      
    console.log('Updated call stats:', data);
  } catch (error) {
    console.warn('Could not update call stats via RPC, table may not exist:', error);
    // If the RPC fails, we'll just continue without updating stats
  }
};

export const fetchLeadsFromDatabase = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
  
  return (data || []).map(lead => ({
    id: lead.id,
    name: lead.name,
    phoneNumber: lead.phone_number,
    phoneId: lead.phone_id,
    status: lead.status as CallStatus,
    disposition: lead.disposition,
    duration: lead.duration,
    cost: lead.cost,
    createdAt: new Date(lead.created_at),
    updatedAt: lead.updated_at ? new Date(lead.updated_at) : undefined
  }));
};

export const fetchCallStats = async () => {
  try {
    // Try to use the RPC if it exists
    const { data, error } = await supabase
      .rpc('get_call_stats')
      .single();
      
    if (!error && data) {
      return {
        completedCalls: data.completed_calls || 0,
        inProgressCalls: data.in_progress_calls || 0,
        remainingCalls: data.remaining_calls || 0,
        failedCalls: data.failed_calls || 0,
        totalMinutes: data.total_minutes || 0,
        totalCost: data.total_cost || 0
      };
    }
  } catch (e) {
    console.warn('Could not fetch call stats via RPC:', e);
  }
  
  // If RPC fails, calculate stats from the leads table
  try {
    const { data: leads } = await supabase
      .from('leads')
      .select('status');
      
    if (leads) {
      const completedCalls = leads.filter(l => l.status === CallStatus.COMPLETED).length;
      const inProgressCalls = leads.filter(l => l.status === CallStatus.IN_PROGRESS).length;
      const failedCalls = leads.filter(l => l.status === CallStatus.FAILED).length;
      const pendingCalls = leads.filter(l => l.status === CallStatus.PENDING).length;
      
      return {
        completedCalls,
        inProgressCalls,
        remainingCalls: pendingCalls,
        failedCalls,
        totalMinutes: 0, // We don't have this information without the call_stats table
        totalCost: 0     // We don't have this information without the call_stats table
      };
    }
  } catch (e) {
    console.error('Error calculating call stats from leads:', e);
  }
  
  // Return default values if all fails
  return {
    completedCalls: 0,
    inProgressCalls: 0,
    remainingCalls: 0,
    failedCalls: 0,
    totalMinutes: 0,
    totalCost: 0
  };
};

const parseCSV = (csv: string): Lead[] => {
  const lines = csv.split('\n');
  
  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row");
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate required columns
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'lead name');
  const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'phone number');
  
  if (nameIndex === -1 || phoneIndex === -1) {
    throw new Error("CSV must contain 'Name' and 'Phone Number' columns");
  }
  
  const leads: Lead[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = line.split(',');
      
      if (values.length >= Math.max(nameIndex, phoneIndex) + 1) {
        const name = values[nameIndex].trim();
        const phoneNumber = values[phoneIndex].trim();
        
        leads.push({
          id: uuidv4(),
          name,
          phoneNumber,
          status: CallStatus.PENDING,
          createdAt: new Date(),
        });
      }
    }
  }
  
  return leads;
};
