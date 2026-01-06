import { Layout } from "@/components/layout";
import { useSales } from "@/hooks/use-sales";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function SalesHistory() {
  const { data: sales, isLoading } = useSales();

  // Sort by date descending
  const sortedSales = sales?.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-display font-bold">Sales History</h2>
          <p className="text-muted-foreground">View past transactions and invoices.</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales?.map((sale) => {
                  const itemsText = sale.items
                    .map(i => i.name)
                    .join(", ");
                  const truncatedItems = itemsText.length > 50 
                    ? itemsText.substring(0, 47) + "..."
                    : itemsText;
                  
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <TableCell className="font-medium">
                        {format(new Date(sale.date), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {sale.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell title={itemsText}>
                        {truncatedItems}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        PKR {sale.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && sortedSales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No sales records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
