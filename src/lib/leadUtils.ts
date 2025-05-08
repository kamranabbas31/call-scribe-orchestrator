
import { Lead, CallStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const uploadLeads = async (file: File): Promise<Lead[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const leads = parseCSV(csv);
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
