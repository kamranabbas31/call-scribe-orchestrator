
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { CallLogTable } from "@/components/CallLogTable";
import { CallMetrics } from "@/components/CallMetrics";
import { CallExecutionController } from "@/components/CallExecutionController";
import { Lead, CallStats, CallStatus, PhoneId } from "@/types";
import { uploadLeads } from "@/lib/leadUtils";
import { generateMockPhoneIds, initializePhoneIds } from "@/lib/phoneUtils";
import { toast } from "sonner";
import { VapiService } from "@/lib/vapiService";

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [phoneIds, setPhoneIds] = useState<PhoneId[]>([]);
  const [stats, setStats] = useState<CallStats>({
    completedCalls: 0,
    inProgressCalls: 0,
    remainingCalls: 0,
    failedCalls: 0,
    totalMinutes: 0,
    totalCost: 0,
  });

  // Initialize phone IDs
  useEffect(() => {
    // In a real app, we would fetch this from an API or config
    const ids = generateMockPhoneIds(400);
    const initializedIds = initializePhoneIds(ids);
    setPhoneIds(initializedIds);
  }, []);

  // Update stats whenever leads change
  useEffect(() => {
    const inProgress = leads.filter(lead => lead.status === CallStatus.IN_PROGRESS).length;
    const completed = leads.filter(lead => lead.status === CallStatus.COMPLETED).length;
    const failed = leads.filter(lead => lead.status === CallStatus.FAILED).length;
    const remaining = leads.filter(lead => lead.status === CallStatus.PENDING).length;
    
    // Calculate total minutes and cost
    const totalMinutes = leads.reduce((total, lead) => {
      return total + (lead.duration || 0);
    }, 0);
    
    const totalCost = leads.reduce((total, lead) => {
      return total + (lead.cost || 0);
    }, 0);
    
    setStats({
      inProgressCalls: inProgress,
      completedCalls: completed,
      failedCalls: failed,
      remainingCalls: remaining,
      totalMinutes: Math.round(totalMinutes * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100
    });
  }, [leads]);

  const handleFileUpload = async (file: File) => {
    try {
      const parsedLeads = await uploadLeads(file);
      setLeads(parsedLeads);
      toast.success(`Successfully uploaded ${parsedLeads.length} leads`);
    } catch (error) {
      toast.error("Failed to upload file: " + (error as Error).message);
    }
  };

  // Simulates receiving webhooks from VAPI.AI
  useEffect(() => {
    // This interval simulates webhook callbacks from VAPI.AI
    const webhookSimulation = setInterval(() => {
      const inProgressLeads = leads.filter(lead => lead.status === CallStatus.IN_PROGRESS);
      
      if (inProgressLeads.length === 0) {
        return;
      }
      
      // Randomly select some in-progress leads to complete
      const leadsToUpdate = inProgressLeads.filter(() => Math.random() > 0.7);
      
      if (leadsToUpdate.length === 0) {
        return;
      }
      
      // Update the leads with simulated webhook data
      const updatedLeads = leads.map(lead => {
        const shouldUpdate = leadsToUpdate.some(l => l.id === lead.id);
        
        if (shouldUpdate && lead.status === CallStatus.IN_PROGRESS) {
          // Mock webhook data
          const mockWebhookData = {
            leadId: lead.id,
            duration: Math.round((Math.random() * 3 + 1) * 10) / 10, // 1-4 minutes
            disposition: Math.random() > 0.3 ? "Interested" : "Not Interested"
          };
          
          try {
            // Process the webhook data (in a real app, this would be called from a webhook endpoint)
            return VapiService.processCallWebhook(mockWebhookData, [lead]);
          } catch (error) {
            console.error("Error processing webhook:", error);
            return lead;
          }
        }
        
        return lead;
      });
      
      setLeads(updatedLeads);
      
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(webhookSimulation);
  }, [leads]);

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Scribe Orchestrator</h1>
            <p className="text-gray-600">Manage AI-powered outbound calling with VAPI.AI</p>
          </div>
          
          <CallExecutionController 
            leads={leads} 
            onLeadUpdate={setLeads}
            initialPhoneIds={phoneIds}
          />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CallMetrics stats={stats} isExecuting={stats.inProgressCalls > 0} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <CardTitle>Lead Management</CardTitle>
              <FileUploader onUpload={handleFileUpload} disabled={stats.inProgressCalls > 0} />
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
