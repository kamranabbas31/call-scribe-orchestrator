
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { PacingControls } from "@/components/PacingControls";
import { CallLogTable } from "@/components/CallLogTable";
import { CallMetrics } from "@/components/CallMetrics";
import { Lead, CallStats, CallStatus } from "@/types";
import { uploadLeads } from "@/lib/leadUtils";
import { generateMockPhoneIds } from "@/lib/phoneUtils";

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pacingRate, setPacingRate] = useState<number>(1);
  const [stats, setStats] = useState<CallStats>({
    completedCalls: 0,
    inProgressCalls: 0,
    remainingCalls: leads.length,
    failedCalls: 0,
    totalMinutes: 0,
    totalCost: 0,
  });
  const [phoneIds, setPhoneIds] = useState<string[]>([]);

  // Initialize phone IDs
  useEffect(() => {
    // In a real app, we would fetch this from an API or config
    const ids = generateMockPhoneIds(400);
    setPhoneIds(ids);
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      const parsedLeads = await uploadLeads(file);
      setLeads(parsedLeads);
      setStats(prev => ({
        ...prev,
        remainingCalls: parsedLeads.length
      }));
      toast.success(`Successfully uploaded ${parsedLeads.length} leads`);
    } catch (error) {
      toast.error("Failed to upload file: " + (error as Error).message);
    }
  };

  const startExecution = () => {
    if (leads.length === 0) {
      toast.warning("No leads to process. Please upload a CSV file first.");
      return;
    }
    setIsExecuting(true);
    toast.success("Call execution started");
    
    // In a real implementation, we would start making API calls to VAPI.AI here
    // For now, we'll just simulate progress
    simulateCalls();
  };

  const stopExecution = () => {
    setIsExecuting(false);
    toast.info("Call execution stopped");
  };
  
  const simulateCalls = () => {
    // This is just a simulation for the UI
    // In a real implementation, this would be replaced with actual API calls
    
    // Update some leads to "In Progress" for demonstration
    const updatedLeads = [...leads];
    const pendingLeads = updatedLeads.filter(lead => lead.status === CallStatus.PENDING);
    
    if (pendingLeads.length === 0) {
      setIsExecuting(false);
      return;
    }
    
    // Set a random number of calls to "In Progress"
    const callsToProcess = Math.min(pendingLeads.length, Math.floor(Math.random() * 5) + 1);
    
    for (let i = 0; i < callsToProcess; i++) {
      const index = updatedLeads.indexOf(pendingLeads[i]);
      if (index !== -1) {
        updatedLeads[index] = {
          ...updatedLeads[index],
          status: CallStatus.IN_PROGRESS,
          phoneId: phoneIds[Math.floor(Math.random() * phoneIds.length)]
        };
      }
    }
    
    setLeads(updatedLeads);
    
    // Update stats
    const inProgress = updatedLeads.filter(lead => lead.status === CallStatus.IN_PROGRESS).length;
    const completed = updatedLeads.filter(lead => lead.status === CallStatus.COMPLETED).length;
    const failed = updatedLeads.filter(lead => lead.status === CallStatus.FAILED).length;
    const remaining = updatedLeads.filter(lead => lead.status === CallStatus.PENDING).length;
    
    setStats({
      inProgressCalls: inProgress,
      completedCalls: completed,
      failedCalls: failed,
      remainingCalls: remaining,
      totalMinutes: Math.round(completed * (Math.random() * 3 + 1) * 10) / 10, // Random minutes between 1-4 minutes
      totalCost: Math.round(completed * (Math.random() * 3 + 1) * 0.99 * 100) / 100 // Cost calculation
    });
    
    // Simulate completing some calls after a delay
    setTimeout(() => {
      if (!isExecuting) return;
      
      const updatedLeadsAfterDelay = [...updatedLeads];
      const inProgressLeads = updatedLeadsAfterDelay.filter(lead => lead.status === CallStatus.IN_PROGRESS);
      
      // Complete some of the in-progress calls
      const callsToComplete = Math.floor(inProgressLeads.length * 0.7);
      
      for (let i = 0; i < callsToComplete; i++) {
        const index = updatedLeadsAfterDelay.indexOf(inProgressLeads[i]);
        if (index !== -1) {
          const duration = Math.round((Math.random() * 3 + 1) * 10) / 10;
          const cost = Math.round(duration * 0.99 * 100) / 100;
          
          updatedLeadsAfterDelay[index] = {
            ...updatedLeadsAfterDelay[index],
            status: CallStatus.COMPLETED,
            disposition: Math.random() > 0.3 ? "Interested" : "Not Interested",
            duration: duration,
            cost: cost,
            updatedAt: new Date()
          };
        }
      }
      
      // Fail some calls randomly
      const remainingInProgress = updatedLeadsAfterDelay.filter(
        lead => lead.status === CallStatus.IN_PROGRESS
      );
      
      for (let i = 0; i < remainingInProgress.length; i++) {
        if (Math.random() > 0.7) {
          const index = updatedLeadsAfterDelay.indexOf(remainingInProgress[i]);
          if (index !== -1) {
            updatedLeadsAfterDelay[index] = {
              ...updatedLeadsAfterDelay[index],
              status: CallStatus.FAILED,
              updatedAt: new Date()
            };
          }
        }
      }
      
      setLeads(updatedLeadsAfterDelay);
      
      // Continue the simulation
      if (isExecuting) {
        setTimeout(() => simulateCalls(), 1000 / pacingRate);
      }
    }, 2000); // Simulate 2 seconds of call time
  };

  const handlePacingChange = (newRate: number) => {
    setPacingRate(newRate);
    toast.success(`Pacing rate set to ${newRate} calls per second`);
  };

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Scribe Orchestrator</h1>
            <p className="text-gray-600">Manage AI-powered outbound calling with VAPI.AI</p>
          </div>
          
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
                  disabled={leads.length === 0}
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
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CallMetrics stats={stats} isExecuting={isExecuting} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <CardTitle>Lead Management</CardTitle>
              <FileUploader onUpload={handleFileUpload} disabled={isExecuting} />
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Call Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CallLogTable leads={leads} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
