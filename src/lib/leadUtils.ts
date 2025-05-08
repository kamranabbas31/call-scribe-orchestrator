
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
        
        // Update call stats with the new remaining calls
        const { data: existingStats } = await supabase
          .from('call_stats')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();
          
        if (existingStats) {
          await supabase
            .from('call_stats')
            .update({
              remaining_calls: existingStats.remaining_calls + leads.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', '00000000-0000-0000-0000-000000000001');
        } else {
          await supabase
            .from('call_stats')
            .insert({
              id: '00000000-0000-0000-0000-000000000001',
              remaining_calls: leads.length,
              completed_calls: 0,
              in_progress_calls: 0,
              failed_calls: 0,
              total_minutes: 0,
              total_cost: 0
            });
        }
        
        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (e) => {
      reject(new Error("Error reading the file"));
    };
    
    reader.readAsText(file);
  });
};

export const fetchLeadsFromDatabase = async (): Promise<Lead[]> => {
  const leads: Lead[] = [];

  try {
    const response = await fetch('/leads.csv');
    const csvText = await response.text();

    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const nameIndex = headers.findIndex(h => h === 'name');
    const phoneIndex = headers.findIndex(h => h === 'phone');

    if (nameIndex === -1 || phoneIndex === -1) {
      throw new Error("CSV must contain 'name' and 'phone' columns");
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');

      if (values.length < 2) continue;

      leads.push({
        id: i.toString(),
        name: values[nameIndex].trim(),
        phone: values[phoneIndex].trim(),
        status: CallStatus.PENDING,
      });
    }

    return leads;
  } catch (err) {
    console.error('Error loading CSV leads:', err);
    return [];
  }
};

export const fetchCallStats = async () => {
  const { data, error } = await supabase
    .from('call_stats')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching call stats:', error);
    throw new Error('Failed to fetch call stats from database');
  }
  
  if (!data) {
    return {
      completedCalls: 0,
      inProgressCalls: 0,
      remainingCalls: 0,
      failedCalls: 0,
      totalMinutes: 0,
      totalCost: 0
    };
  }
  
  return {
    completedCalls: data.completed_calls,
    inProgressCalls: data.in_progress_calls,
    remainingCalls: data.remaining_calls,
    failedCalls: data.failed_calls,
    totalMinutes: data.total_minutes,
    totalCost: data.total_cost
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
