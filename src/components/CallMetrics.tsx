
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CallStats } from "@/types";
import { Phone, Check, Loader, X, Clock } from "lucide-react";

interface CallMetricsProps {
  stats: CallStats;
  isExecuting: boolean;
}

export const CallMetrics = ({ stats, isExecuting }: CallMetricsProps) => {
  const { completedCalls, inProgressCalls, remainingCalls, failedCalls, totalMinutes, totalCost } = stats;

  const statusCards = [
    {
      title: "Completed Calls",
      value: completedCalls,
      icon: <Check className="h-4 w-4 text-green-600" />,
      color: "border-l-4 border-green-500",
    },
    {
      title: "In Progress",
      value: inProgressCalls,
      icon: <Loader className={`h-4 w-4 text-blue-600 ${isExecuting ? "animate-spin" : ""}`} />,
      color: "border-l-4 border-blue-500",
    },
    {
      title: "Remaining Calls",
      value: remainingCalls,
      icon: <Phone className="h-4 w-4 text-gray-600" />,
      color: "border-l-4 border-gray-400",
    },
    {
      title: "Failed Calls",
      value: failedCalls,
      icon: <X className="h-4 w-4 text-red-600" />,
      color: "border-l-4 border-red-500",
    },
  ];

  return (
    <>
      {statusCards.map((card) => (
        <Card key={card.title} className={`${card.color}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-l-4 border-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Duration
          </CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMinutes.toFixed(1)} min</div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-amber-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Cost
          </CardTitle>
          <span className="text-amber-600 font-bold text-sm">$</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          <CardDescription className="text-xs pt-1">
            @ $0.99 per minute
          </CardDescription>
        </CardContent>
      </Card>
    </>
  );
};
