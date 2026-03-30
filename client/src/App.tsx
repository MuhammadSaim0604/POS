import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/dashboard";
import Bills from "@/pages/bills";
import CreateBill from "@/pages/create-bill";
import Medicines from "@/pages/medicines";
import Categories from "@/pages/categories";
import SalesHistory from "@/pages/sales";
import Restock from "@/pages/restock";
import LowStockAlerts from "@/pages/alerts";
import Settings from "@/pages/settings";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bills" component={Bills} />
      <Route path="/bills/create" component={CreateBill} />
      <Route path="/bills/:id/edit" component={CreateBill} />
      <Route path="/medicines" component={Medicines} />
      <Route path="/categories" component={Categories} />
      <Route path="/sales" component={SalesHistory} />
      <Route path="/restock" component={Restock} />
      <Route path="/alerts" component={LowStockAlerts} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      <Route path="/analytics" component={Dashboard} /> {/* Reusing dashboard for now */}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
