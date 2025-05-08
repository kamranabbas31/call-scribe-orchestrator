
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { CallLogTable } from "@/components/CallLogTable";
import { CallMetrics } from "@/components/CallMetrics";
import { CallExecutionController } from "@/components/CallExecutionController";
import { Lead, CallStats, PhoneId } from "@/types";
import { uploadLeads, fetchLeadsFromDatabase, fetchCallStats } from "@/lib/leadUtils";
import { generateMockPhoneIds, initializePhoneIds, getPhoneIds, checkAndResetDailyCounts } from "@/lib/phoneUtils";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { isMockClient } from "@/lib/supabase/client";

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const usingMockClient = isMockClient();

  // Fetch leads from the database
  const { 
    data: leads = [], 
    isLoading: isLeadsLoading,
    error: leadsError 
  } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeadsFromDatabase,
    // Don't attempt to fetch data if we're using the mock client
    enabled: !usingMockClient
  });

  // Fetch call stats from the database
  const {
    data: stats = {
      completedCalls: 0,
      inProgressCalls: 0,
      remainingCalls: 0,
      failedCalls: 0,
      totalMinutes: 0,
      totalCost: 0
    },
    isLoading: isStatsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['callStats'],
    queryFn: fetchCallStats,
    // Don't attempt to fetch data if we're using the mock client
    enabled: !usingMockClient
  });

  // Fetch phone IDs from the database
  const {
    data: phoneIds = [],
    isLoading: isPhoneIdsLoading,
    error: phoneIdsError
  } = useQuery({
    queryKey: ['phoneIds'],
    queryFn: getPhoneIds,
    // Don't attempt to fetch data if we're using the mock client
    enabled: !usingMockClient
  });

  // Initialize phone IDs if needed
  useEffect(() => {
    const initPhoneIds = async () => {
      try {
        if (!usingMockClient && !isPhoneIdsLoading && phoneIds.length === 0) {
          // In a real app, we would fetch these from a config or database
          const ids = generateMockPhoneIds(400);
          await initializePhoneIds(ids);
          queryClient.invalidateQueries({ queryKey: ['phoneIds'] });
        }
      } catch (error) {
        console.error("Error initializing phone IDs:", error);
        toast.error("Failed to initialize phone IDs");
      }
    };

    initPhoneIds();
  }, [isPhoneIdsLoading, phoneIds.length, queryClient, usingMockClient]);

  // Check and reset daily call counts if needed
  useEffect(() => {
    if (usingMockClient) return;
    
    const checkReset = async () => {
      try {
        const wasReset = await checkAndResetDailyCounts();
        if (wasReset) {
          toast.info("Daily call counts have been reset");
          queryClient.invalidateQueries({ queryKey: ['phoneIds'] });
        }
      } catch (error) {
        console.error("Error checking daily reset:", error);
      }
    };

    checkReset();
    
    // Check every hour
    const interval = setInterval(checkReset, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [queryClient, usingMockClient]);

  const handleFileUpload = async (file: File) => {
    if (usingMockClient) {
      toast.error("Cannot upload leads: Supabase connection not configured");
      return;
    }
    
    setIsLoading(true);
    try {
      const parsedLeads = await uploadLeads(file);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['callStats'] });
      toast.success(`Successfully uploaded ${parsedLeads.length} leads`);
    } catch (error) {
      toast.error("Failed to upload file: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Display any errors
  if (leadsError || statsError || phoneIdsError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {leadsError?.message || statsError?.message || phoneIdsError?.message || "An unknown error occurred"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8">
      {usingMockClient && (
        <Alert className="mb-6 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Supabase Connection Not Configured</AlertTitle>
          <AlertDescription className="text-amber-700">
            Running in development mode with a mock client. To enable full functionality, 
            please connect to Supabase and set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY 
            environment variables.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Scribe Orchestrator</h1>
            <p className="text-gray-600">Manage AI-powered outbound calling with VAPI.AI</p>
          </div>
          
          <CallExecutionController />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CallMetrics stats={stats} isExecuting={stats.inProgressCalls > 0} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <CardTitle>Lead Management</CardTitle>
              <FileUploader onUpload={handleFileUpload} disabled={isLoading || stats.inProgressCalls > 0 || usingMockClient} />
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Call Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CallLogTable leads={leads} isLoading={isLeadsLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
