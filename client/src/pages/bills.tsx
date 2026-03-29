import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useBills,
  useDeleteBill,
  useUpdateBillStatus,
} from "@/hooks/use-bills";
import { useProducts } from "@/hooks/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Printer,
  FileText,
  Eye,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Bill } from "@shared/schema";
import { BillTemplate } from "@/components/bill-template";
import { useCategories } from "@/hooks/use-categories";
import html2pdf from "html2pdf.js";

export default function Bills() {
  const { data: bills, isLoading } = useBills();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const deleteBill = useDeleteBill();
  const updateStatus = useUpdateBillStatus();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(
    null,
  );

  const handlePrint = (bill: Bill) => {
    setSelectedBill(bill);
    setTimeout(() => {
      const element = document.getElementById("bill-print-template");
      console.log("element", element);
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `Bill-${bill.billNumber}.pdf`,
        image: { type: "jpeg" as "jpeg" | "png" | "webp", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as "portrait" | "landscape",
        },
      };

      html2pdf().from(element).set(opt).save();
      handleStatusChange(bill.id, "printed");
      setSelectedBillForPrint(null);
    }, 500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      await deleteBill.mutateAsync(id);
      toast({
        title: "Bill deleted",
        description: "Bill has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "draft" | "completed" | "printed",
  ) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({
        title: "Status updated",
        description: `Bill marked as ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "printed":
        return <Badge className="bg-green-600">Printed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const sortedBills = bills?.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bills</h1>
            <p className="text-muted-foreground mt-1">
              Manage wholesale bills and invoices
            </p>
          </div>
          <Button
            onClick={() => setLocation("/bills/create")}
            data-testid="button-create-bill"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Bill
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading bills...
              </div>
            ) : sortedBills?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No bills found. Create your first bill to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBills?.map((bill) => (
                    <TableRow
                      key={bill.id}
                      className="hover:bg-muted/50 transition-colors"
                      data-testid={`row-bill-${bill.id}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {bill.customerName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {bill.customerPhone}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(bill.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        PKR {bill.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedBill(bill)}
                            data-testid={`button-view-bill-${bill.id}`}
                            title="View Details"
                          >
                            <Eye className="h-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-actions-${bill.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setLocation(`/bills/${bill.id}/edit`)
                                }
                                data-testid={`button-edit-bill-${bill.id}`}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePrint(bill)}
                                data-testid={`button-print-bill-${bill.id}`}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(bill.id)}
                                className="text-destructive"
                                data-testid={`button-delete-bill-${bill.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedBill}
        onOpenChange={(open) => !open && setSelectedBill(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl">
          {selectedBill && (
            <>
              <DialogHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {selectedBill.billNumber}
                    </DialogTitle>
                    <DialogDescription className="text-base mt-1">
                      Customer:{" "}
                      <span className="font-semibold text-foreground">
                        {selectedBill.customerName}
                      </span>
                      {selectedBill.customerPhone && (
                        <span className="ml-2">
                          • {selectedBill.customerPhone}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedBill.date), "MMMM d, yyyy")}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(selectedBill.status)}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <ScrollArea className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" /> Items
                    </h3>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Medicine</TableHead>
                            <TableHead className="text-center">
                              Packets
                            </TableHead>
                            <TableHead className="text-right">
                              Price/Item
                            </TableHead>
                            <TableHead className="text-right">
                              Discount/Item
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBill.items.map((item, index) => {
                            const medicine = products?.find(
                              (p) => p.id === item.productId,
                            );
                            const totalPerPacket =
                              (item.pricePerItem -
                                (item.discountPerItem || 0)) *
                              item.itemsPerPacket;
                            const total = totalPerPacket * item.packetQuantity;

                            return (
                              <TableRow
                                key={`${selectedBill.id}-item-${index}`}
                              >
                                <TableCell className="p-2">
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                    {medicine?.image ? (
                                      <img
                                        src={medicine.image}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-6 h-6 text-muted-foreground/20" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {item.productName}
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    {item.color && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] py-0 h-4"
                                      >
                                        {item.color}
                                      </Badge>
                                    )}
                                    {item.size && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] py-0 h-4"
                                      >
                                        {item.size}
                                      </Badge>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">
                                      {item.itemsPerPacket} items/packet
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                  {item.packetQuantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  PKR {item.pricePerItem.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-red-500">
                                  {item.discountPerItem
                                    ? `-PKR ${item.discountPerItem.toFixed(2)}`
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  PKR {total.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {selectedBill.notes && (
                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Notes
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedBill.notes}
                      </p>
                    </div>
                  )}

                  {/* Print Template Hidden */}
                  <div className="hidden">
                    <BillTemplate
                      bill={selectedBill}
                      categories={categories || []}
                      products={products || []}
                    />
                  </div>
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-6 bg-muted/20">
                <div className="space-y-2 max-w-xs ml-auto">
                  {selectedBill.discountOnBill > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Bill Discount:
                      </span>
                      <span className="text-red-500">
                        -PKR {selectedBill.discountOnBill.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-2xl font-black text-primary">
                      PKR {selectedBill.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
