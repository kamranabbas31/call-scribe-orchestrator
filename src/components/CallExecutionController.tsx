
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lead, PhoneId, CallStatus } from "@/types";
import { VapiService } from "@/lib/vapiService";
import { PacingControls } from "@/components/PacingControls";

interface CallExecutionControllerProps {
  leads: Lead[];
  onLeadUpdate: (updatedLeads: Lead[]) => void;
  initialPhoneIds: PhoneId[];
  initialPacingRate?: number;
}

export const CallExecutionController = ({
  leads,
  onLeadUpdate,
  initialPhoneIds,
  initialPacingRate = 1
}: CallExecutionControllerProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [pacingRate, setPacingRate] = useState<number>(initialPacingRate);
  const [phoneIds, setPhoneIds] = useState<PhoneId[]>(initialPhoneIds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [executionInterval, setExecutionInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (executionInterval) {
        clearInterval(executionInterval);
      }
    };
  }, [executionInterval]);
  
  const handlePacingChange = (newRate: number) => {
    setPacingRate(newRate);
    toast.success(`Pacing rate set to ${newRate} calls per second`);
    
    // If currently executing, restart the execution with the new rate
    if (isExecuting) {
      stopExecution();
      startExecution();
    }
  };
  
  const processSingleLead = useCallback(async () => {
    // Find the next pending lead
    const pendingLeads = leads.filter(lead => lead.status === CallStatus.PENDING);
    
    if (pendingLeads.length === 0) {
      toast.info("All leads have been processed");
      stopExecution();
      return;
    }
    
    try {
      const leadToProcess = pendingLeads[0];
      
      // Make the API call to VAPI.AI (simulated in our service)
      const { updatedLead, updatedPhoneIds } = await VapiService.makeCall(
        leadToProcess, 
        phoneIds
      );
      
      // Update the leads array with the updated lead
      const updatedLeads = leads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      );
      
      // Update state
      onLeadUpdate(updatedLeads);
      setPhoneIds(updatedPhoneIds);
      
    } catch (error) {
      console.error("Error processing lead:", error);
      toast.error(`Failed to process lead: ${(error as Error).message}`);
    }
  }, [leads, phoneIds, onLeadUpdate]);
  
  const startExecution = useCallback(() => {
    if (leads.filter(lead => lead.status === CallStatus.PENDING).length === 0) {
      toast.warning("No pending leads to process");
      return;
    }
    
    setIsExecuting(true);
    toast.success("Call execution started");
    
    // Calculate interval based on pacing rate (calls per second)
    const intervalMs = 1000 / pacingRate;
    
    // Start the execution interval
    const interval = setInterval(processSingleLead, intervalMs);
    setExecutionInterval(interval);
    
  }, [leads, pacingRate, processSingleLead]);
  
  const stopExecution = useCallback(() => {
    if (executionInterval) {
      clearInterval(executionInterval);
      setExecutionInterval(null);
    }
    
    setIsExecuting(false);
    toast.info("Call execution stopped");
  }, [executionInterval]);
  
  return (
    <div className="flex items-center gap-4">
      <PacingControls 
        currentPacing={pacingRate} 
        onChange={handlePacingChange}
        disabled={isExecuting} 
      />
      <div className="flex gap-2">
        {!isExecuting ? (
          <Button 
            onClick={startExecution}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={leads.filter(lead => lead.status === CallStatus.PENDING).length === 0}
          >
            Start Execution
          </Button>
        ) : (
          <Button 
            onClick={stopExecution}
            variant="destructive"
          >
            Stop Execution
          </Button>
        )}
      </div>
    </div>
  );
};
