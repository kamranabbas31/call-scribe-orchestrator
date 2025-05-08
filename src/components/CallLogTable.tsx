
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lead, CallStatus } from "@/types";
import { formatPhoneNumber } from "@/lib/formatters";

interface CallLogTableProps {
  leads: Lead[];
}

export const CallLogTable = ({ leads }: CallLogTableProps) => {
  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case CallStatus.PENDING:
        return <Badge variant="outline" className="bg-gray-100">Pending</Badge>;
      case CallStatus.IN_PROGRESS:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 animate-pulse-light">In Progress</Badge>;
      case CallStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case CallStatus.FAILED:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Phone ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead>Cost ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{formatPhoneNumber(lead.phoneNumber)}</TableCell>
                  <TableCell>{lead.phoneId || "-"}</TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>{lead.disposition || "-"}</TableCell>
                  <TableCell>{lead.duration?.toFixed(1) || "-"}</TableCell>
                  <TableCell>
                    {lead.cost ? `$${lead.cost.toFixed(2)}` : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No leads available. Please upload a CSV file.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
