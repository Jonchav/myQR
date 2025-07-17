import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, History, BarChart3 } from "lucide-react";
import StatsDashboard from "./StatsDashboard";
import { QRHistory } from "./QRHistory";

interface StatsAndHistoryProps {
  onEditQR?: (qr: any) => void;
}

export default function StatsAndHistory({ onEditQR }: StatsAndHistoryProps) {
  const [activeSubTab, setActiveSubTab] = useState("dashboard");

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Estadísticas PRO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-purple-600"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-purple-600"
              >
                <History className="w-4 h-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <StatsDashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <QRHistory onEditQR={onEditQR} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}