
import { Lead, PhoneId, CallStatus } from "@/types";
import { getNextAvailablePhoneId, incrementPhoneIdUsage } from "./phoneUtils";

// In a real implementation, this would be an environment variable
const VAPI_API_URL = "https://api.vapi.ai/call"; // Example URL, replace with actual VAPI.AI endpoint

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
  // This method would be replaced with actual API call in a production environment
  static async makeCall(
    lead: Lead,
    phoneIds: PhoneId[],
    dailyLimit: number = 100
  ): Promise<{ updatedLead: Lead; updatedPhoneIds: PhoneId[] }> {
    // Get next available phone ID
    const phoneId = getNextAvailablePhoneId(phoneIds, dailyLimit);
    
    if (!phoneId) {
      throw new Error("No available phone IDs to make calls");
    }
    
    try {
      // In a real implementation, this would make an actual API call
      // const response = await fetch(VAPI_API_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
      //   },
      //   body: JSON.stringify({
      //     phoneNumber: lead.phoneNumber,
      //     name: lead.name,
      //     phoneId
      //     // Additional parameters required by VAPI.AI
      //   })
      // });
      
      // const result = await response.json();
      
      // For simulation purposes, we'll create a mock response
      const mockResponse: VapiCallResponse = {
        callId: `call_${Math.random().toString(36).substring(2, 10)}`,
        status: "in_progress"
      };
      
      // Update the lead with the phone ID and change status
      const updatedLead: Lead = {
        ...lead,
        phoneId,
        status: CallStatus.IN_PROGRESS,
        updatedAt: new Date()
      };
      
      // Update the phone ID usage count
      const updatedPhoneIds = incrementPhoneIdUsage(phoneIds, phoneId);
      
      return {
        updatedLead,
        updatedPhoneIds
      };
    } catch (error) {
      console.error("Error making VAPI call:", error);
      
      // Update the lead to failed status
      const updatedLead: Lead = {
        ...lead,
        status: CallStatus.FAILED,
        updatedAt: new Date()
      };
      
      return {
        updatedLead,
        updatedPhoneIds: phoneIds
      };
    }
  }
  
  // This method would process a webhook response from VAPI.AI
  static processCallWebhook(
    webhookData: any,
    leads: Lead[]
  ): Lead {
    // In a real implementation, we would match the webhook data to a specific lead
    // For simulation, we'll just return a mock updated lead
    const leadToUpdate = leads.find(lead => lead.id === webhookData.leadId);
    
    if (!leadToUpdate) {
      throw new Error("Lead not found for the webhook data");
    }
    
    const duration = Number(webhookData.duration || Math.random() * 5 + 1);
    const cost = duration * 0.99;
    
    return {
      ...leadToUpdate,
      status: CallStatus.COMPLETED,
      disposition: webhookData.disposition || "Completed",
      duration,
      cost,
      updatedAt: new Date()
    };
  }
}
