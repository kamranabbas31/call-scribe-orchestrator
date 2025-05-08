
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lead, CallStatus } from "@/types";
import { VapiService } from "@/lib/vapiService";
import { PacingControls } from "@/components/PacingControls";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLeadsFromDatabase } from "@/lib/leadUtils";
import { supabase, isMockClient } from "@/lib/supabase/client";

interface CallExecutionControllerProps {
  initialPacingRate?: number;
}

export const CallExecutionController = ({
  initialPacingRate = 1
}: CallExecutionControllerProps) => {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [pacingRate, setPacingRate] = useState<number>(initialPacingRate);
  const [executionInterval, setExecutionInterval] = useState<NodeJS.Timeout | null>(null);
  const usingMockClient = isMockClient();
  
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeadsFromDatabase,
    // Don't attempt to fetch data if we're using the mock client
    enabled: !usingMockClient
  });

  // Set up real-time subscription to listen for lead updates
  useEffect(() => {
    if (usingMockClient) return;
    
    const subscription = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['callStats'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, usingMockClient]);
  
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
      
      // Make the API call to VAPI.AI
      await VapiService.makeCall(leadToProcess);
      
      // Refresh the leads data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['callStats'] });
      
    } catch (error) {
      console.error("Error processing lead:", error);
      toast.error(`Failed to process lead: ${(error as Error).message}`);
    }
  }, [leads, queryClient]);
  
  const startExecution = useCallback(() => {
    if (usingMockClient) {
      toast.error("Cannot start execution: Supabase connection not configured");
      return;
    }
    
    const pendingLeads = leads.filter(lead => lead.status === CallStatus.PENDING);
    
    if (pendingLeads.length === 0) {
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
    
  }, [leads, pacingRate, processSingleLead, usingMockClient]);
  
  const stopExecution = useCallback(() => {
    if (executionInterval) {
      clearInterval(executionInterval);
      setExecutionInterval(null);
    }
    
    setIsExecuting(false);
    toast.info("Call execution stopped");
  }, [executionInterval]);

  const pendingCount = leads.filter(lead => lead.status === CallStatus.PENDING).length;
  
  return (
    <div className="flex items-center gap-4">
      <PacingControls 
        currentPacing={pacingRate} 
        onChange={handlePacingChange}
        disabled={isExecuting || usingMockClient} 
      />
      <div className="flex gap-2">
        {!isExecuting ? (
          <Button 
            onClick={startExecution}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={pendingCount === 0 || usingMockClient}
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
