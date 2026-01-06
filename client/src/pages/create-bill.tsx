import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { useProducts } from "@/hooks/use-products";
import { useCreateBill, useUpdateBill, useBill } from "@/hooks/use-bills";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  Search,
  User,
  Phone,
  FileText,
  X,
  PlusCircle,
  MinusCircle,
  Calculator,
  ChevronDown,
  Barcode,
  Package,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Product, type BillItem, type Category } from "@shared/schema";
import { BillTemplate } from "@/components/bill-template";
import { useCategories } from "@/hooks/use-categories";
import html2pdf from "html2pdf.js";

interface ActiveBill {
  id: string;
  customerName: string;
  customerPhone: string;
  customerBusinessName: string;
  customerCity: string;
  customerAddress: string;
  biltyNo: string;
  remarks: string;
  items: BillItem[];
  discountOnBill: number;
  notes: string;
}

export default function CreateBill() {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createBillMutation = useCreateBill();
  const updateBillMutation = useUpdateBill();
  const { toast } = useToast();

  const [activeBills, setActiveBills] = useState<ActiveBill[]>([
    {
      id: "1",
      customerName: "",
      customerPhone: "",
      customerBusinessName: "",
      customerCity: "",
      customerAddress: "",
      biltyNo: "",
      remarks: "",
      items: [],
      discountOnBill: 0,
      notes: "",
    },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const editBillId = location.match(/\/bills\/([^\/]+)\/edit/)?.[1] || null;
  const { data: editBill, isLoading: isLoadingBill } = useBill(
    editBillId || "",
  );

  // Load bill data if in edit mode
  useEffect(() => {
    if (editBill && editBillId && !isLoadingBill) {
      const billToLoad: ActiveBill = {
        id: editBillId,
        customerName: editBill.customerName,
        customerPhone: editBill.customerPhone,
        customerBusinessName: editBill.customerBusinessName || "",
        customerCity: editBill.customerCity || "",
        customerAddress: editBill.customerAddress || "",
        biltyNo: editBill.biltyNo || "",
        remarks: editBill.remarks || "",
        items: editBill.items,
        discountOnBill: editBill.discountOnBill,
        notes: editBill.notes || "",
      };
      setActiveBills([billToLoad]);
      setActiveTab(editBillId);
    }
  }, [editBill, editBillId, isLoadingBill]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!editBillId) {
      const saved = localStorage.getItem("activeBills");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setActiveBills(parsed);
          const savedTab = localStorage.getItem("activeTab");
          if (savedTab) setActiveTab(savedTab);
        } catch (e) {
          console.error("Failed to load saved bills:", e);
        }
      }
    }
  }, [editBillId]);

  // Save to localStorage whenever bills change
  useEffect(() => {
    if (!editBillId) {
      localStorage.setItem("activeBills", JSON.stringify(activeBills));
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeBills, activeTab, editBillId]);

  // Barcode scanner with visible but invisible input
  useEffect(() => {
    if (isScannerActive) {
      barcodeInputRef.current?.focus();
    }
  }, [isScannerActive]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      e.preventDefault();
      const product = products?.find((p) => p.barcode === barcodeInput.trim());
      if (product) {
        addProductToBill(product);
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
        toast({
          title: "Product Added",
          description: product.name,
          duration: 1000,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${barcodeInput}`,
          variant: "destructive",
        });
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
      }
    }
  };

  const [printBill, setPrintBill] = useState<any | null>(null);

  const currentBill =
    activeBills.find((b) => b.id === activeTab) || activeBills[0];

  const addNewBill = () => {
    const newId = (
      Math.max(...activeBills.map((b) => parseInt(b.id))) + 1
    ).toString();
    const newBill: ActiveBill = {
      id: newId,
      customerName: "",
      customerPhone: "",
      customerBusinessName: "",
      customerCity: "",
      customerAddress: "",
      biltyNo: "",
      remarks: "",
      items: [],
      discountOnBill: 0,
      notes: "",
    };
    setActiveBills([...activeBills, newBill]);
    setActiveTab(newId);
  };

  const removeBill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeBills.length === 1) return;
    const newBills = activeBills.filter((b) => b.id !== id);
    setActiveBills(newBills);
    if (activeTab === id) {
      setActiveTab(newBills[0].id);
    }
  };

  const updateCurrentBill = (updates: Partial<ActiveBill>) => {
    setActiveBills(
      activeBills.map((b) => (b.id === activeTab ? { ...b, ...updates } : b)),
    );
  };

  const addProductToBill = (product: Product) => {
    const existingItemIndex = currentBill.items.findIndex(
      (item) => item.productId === product.id,
    );

    if (existingItemIndex > -1) {
      const updatedItems = [...currentBill.items];
      updatedItems[existingItemIndex].packetQuantity += 1;
      updateCurrentBill({ items: updatedItems });
    } else {
      const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        article: product.article || product.name,
        color: product.color,
        size: product.size,
        pricePerItem: product.price,
        itemsPerPacket: product.itemsPerPacket || 1,
        packetQuantity: 1,
        discountPerItem: 0,
      };
      updateCurrentBill({ items: [...currentBill.items, newItem] });
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const removeProductFromBill = (index: number) => {
    const updatedItems = currentBill.items.filter((_, i) => i !== index);
    updateCurrentBill({ items: updatedItems });
  };

  const updateItem = (index: number, updates: Partial<BillItem>) => {
    const updatedItems = [...currentBill.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    updateCurrentBill({ items: updatedItems });
  };

  const calculateSubtotal = (item: BillItem) => {
    return (
      item.pricePerItem * item.itemsPerPacket * item.packetQuantity -
      item.discountPerItem * item.itemsPerPacket * item.packetQuantity
    );
  };

  const calculateBillTotal = () => {
    const itemsTotal = currentBill.items.reduce(
      (sum, item) => sum + calculateSubtotal(item),
      0,
    );
    return Math.max(0, itemsTotal - currentBill.discountOnBill);
  };

  const handleSave = async (status: "draft" | "completed") => {
    if (!currentBill.customerName || !currentBill.customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please enter customer name and phone.",
        variant: "destructive",
      });
      return;
    }

    if (currentBill.items.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Please add at least one product.",
        variant: "destructive",
      });
      return;
    }

    try {
      const billData = {
        customerName: currentBill.customerName,
        customerPhone: currentBill.customerPhone,
        customerBusinessName: currentBill.customerBusinessName || "",
        customerCity: currentBill.customerCity || "",
        customerAddress: currentBill.customerAddress || "",
        biltyNo: currentBill.biltyNo || "",
        remarks: currentBill.remarks || "",
        items: currentBill.items,
        totalAmount: calculateBillTotal(),
        discountOnBill: currentBill.discountOnBill,
        notes: currentBill.notes || "",
        status,
      };

      let savedBill;
      if (editBillId && currentBill.id === editBillId) {
        savedBill = await updateBillMutation.mutateAsync({
          id: editBillId,
          ...billData,
        });
        toast({
          title: "Bill Updated",
          description: `Successfully updated bill for ${currentBill.customerName}`,
        });
      } else {
        savedBill = await createBillMutation.mutateAsync(billData);
        toast({
          title: status === "completed" ? "Bill Created" : "Draft Saved",
          description: `Successfully processed bill for ${currentBill.customerName}`,
        });
      }

      if (status === "completed" && savedBill) {
        setPrintBill(savedBill);
        // Trigger print after state update
        setTimeout(() => {
          const element = document.getElementById("bill-print-template");
          if (element) {
            const opt = {
              margin: 10,
              filename: `Bill-${savedBill.billNumber}.pdf`,
              image: { type: "jpeg" as "jpeg" | "png" | "webp", quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait" as "portrait" | "landscape",
              },
            };
            html2pdf()
              .from(element)
              .set(opt)
              .save()
              .then(() => {
                setPrintBill(null);
              });
          } else {
            setPrintBill(null);
          }
        }, 500);
      }

      if (
        status === "completed" ||
        (editBillId && currentBill.id === editBillId)
      ) {
        if (activeBills.length > 1) {
          const newBills = activeBills.filter((b) => b.id !== activeTab);
          setActiveBills(newBills);
          setActiveTab(newBills[0].id);
        } else {
          updateCurrentBill({
            customerName: "",
            customerPhone: "",
            customerBusinessName: "",
            customerCity: "",
            customerAddress: "",
            biltyNo: "",
            remarks: "",
            items: [],
            discountOnBill: 0,
            notes: "",
          });
        }
        if (editBillId) setLocation("/bills");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save the bill.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Create Bill</h2>
          <p className="text-muted-foreground">
            Process multiple customer orders simultaneously. Scan barcodes or
            add products manually.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="flex items-center gap-2 p-3 bg-card border-b rounded-t-lg">
            <div className="flex-1 overflow-x-auto flex gap-2 pb-2">
              {activeBills.map((bill) => (
                <button
                  key={bill.id}
                  onClick={() => setActiveTab(bill.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    activeTab === bill.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                  data-testid={`button-bill-tab-${bill.id}`}
                >
                  <span>{bill.customerName || `Customer ${bill.id}`}</span>
                  <button
                    onClick={(e) => removeBill(bill.id, e)}
                    className="hover:text-destructive transition-colors ml-1"
                    data-testid={`button-close-tab-${bill.id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
            <Button
              onClick={addNewBill}
              variant="outline"
              size="sm"
              className="gap-1 flex-shrink-0"
              data-testid="button-add-new-bill"
            >
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>

          {activeBills.map((bill) => (
            <TabsContent
              key={bill.id}
              value={bill.id}
              className="flex-1 mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Items and Info */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Customer Name"
                          value={bill.customerName}
                          onChange={(e) =>
                            updateCurrentBill({ customerName: e.target.value })
                          }
                          data-testid={`input-customer-name-${bill.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input
                          placeholder="Business Name"
                          value={bill.customerBusinessName}
                          onChange={(e) =>
                            updateCurrentBill({
                              customerBusinessName: e.target.value,
                            })
                          }
                          data-testid={`input-customer-business-${bill.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input
                          placeholder="Phone Number"
                          value={bill.customerPhone}
                          onChange={(e) =>
                            updateCurrentBill({ customerPhone: e.target.value })
                          }
                          data-testid={`input-customer-phone-${bill.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="City"
                          value={bill.customerCity}
                          onChange={(e) =>
                            updateCurrentBill({ customerCity: e.target.value })
                          }
                          data-testid={`input-customer-city-${bill.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address/Adda</Label>
                        <Input
                          placeholder="Address or Adda"
                          value={bill.customerAddress}
                          onChange={(e) =>
                            updateCurrentBill({
                              customerAddress: e.target.value,
                            })
                          }
                          data-testid={`input-customer-address-${bill.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bilty No</Label>
                        <Input
                          placeholder="Bilty Number"
                          value={bill.biltyNo}
                          onChange={(e) =>
                            updateCurrentBill({ biltyNo: e.target.value })
                          }
                          data-testid={`input-bilty-no-${bill.id}`}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="min-h-[400px]">
                    <CardHeader className="pb-3">
                      <div className="space-y-3">
                        <div className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Bill Items
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant={isScannerActive ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                setIsScannerActive(!isScannerActive)
                              }
                              className={`gap-2 ${isScannerActive ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                              data-testid="button-activate-scanner"
                            >
                              <Barcode className="w-4 h-4" />{" "}
                              {isScannerActive ? "Scanner Active" : "Scan"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSearch(true)}
                              className="gap-2"
                              data-testid="button-add-product"
                            >
                              <PlusCircle className="w-4 h-4" /> Add Product
                            </Button>
                          </div>
                        </div>
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={handleBarcodeKeyDown}
                          placeholder="Barcode scanner ready..."
                          className="absolute -left-96 top-0 w-96 h-0 opacity-0 focus:outline-none"
                          autoComplete="off"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-24">Price</TableHead>
                            <TableHead className="w-24">Items/Pkt</TableHead>
                            <TableHead className="w-24">Packets</TableHead>
                            <TableHead className="w-24 text-right">
                              Subtotal
                            </TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bill.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">
                                    {item.productName}
                                  </p>
                                  {(item.color || item.size) && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.color} {item.size}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-8 px-0 text-xs"
                                  value={item.pricePerItem}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      pricePerItem: Number(e.target.value),
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-8 text-xs"
                                  value={item.itemsPerPacket}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      itemsPerPacket: Number(e.target.value),
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateItem(index, {
                                        packetQuantity: Math.max(
                                          1,
                                          item.packetQuantity - 1,
                                        ),
                                      })
                                    }
                                  >
                                    <MinusCircle className="w-4 h-4" />
                                  </Button>
                                  <span className="text-xs w-6 text-center">
                                    {item.packetQuantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      updateItem(index, {
                                        packetQuantity: item.packetQuantity + 1,
                                      })
                                    }
                                  >
                                    <PlusCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                PKR {calculateSubtotal(item).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeProductFromBill(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {bill.items.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="h-32 text-center text-muted-foreground"
                              >
                                No items added. Use "Add Product" or scan
                                barcode.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Totals & Actions */}
                <div className="space-y-4">
                  <Card className="bg-primary/5 border-primary/20 sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary" />
                        Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Items Total</span>
                        <span className="font-semibold">
                          PKR{" "}
                          {bill.items
                            .reduce((sum, i) => sum + calculateSubtotal(i), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Flat Discount on Bill</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={bill.discountOnBill}
                          onChange={(e) =>
                            updateCurrentBill({
                              discountOnBill: Number(e.target.value),
                            })
                          }
                          className="font-mono text-right"
                        />
                      </div>
                      <div className="pt-4 border-t border-primary/20">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Grand Total</span>
                          <span className="text-2xl font-display font-bold text-primary">
                            PKR {calculateBillTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {/* Print Template Hidden */}
                      <div className="hidden">
                        <BillTemplate
                          bill={
                            printBill || {
                              id: "temp",
                              billNumber: "PREVIEW",
                              customerName: currentBill.customerName,
                              customerPhone: currentBill.customerPhone,
                              customerBusinessName:
                                currentBill.customerBusinessName,
                              customerCity: currentBill.customerCity,
                              customerAddress: currentBill.customerAddress,
                              biltyNo: currentBill.biltyNo,
                              remarks: currentBill.remarks,
                              items: currentBill.items.map((item) => ({
                                ...item,
                                article: item.article || item.productName,
                              })),
                              totalAmount: calculateBillTotal(),
                              discountOnBill: currentBill.discountOnBill,
                              notes: currentBill.notes,
                              status: "completed",
                              date: new Date().toISOString(),
                            }
                          }
                          categories={categories || []}
                          products={products || []}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-full h-12 text-lg"
                            disabled={createBillMutation.isPending}
                          >
                            <FileText className="w-5 h-5 mr-2" /> Create Bill
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                          <DropdownMenuItem
                            onClick={() => handleSave("completed")}
                            className="flex items-center gap-2 py-2"
                            data-testid="button-create-bill-print"
                          >
                            <Printer className="w-4 h-4" />
                            Create & Print Bill
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex gap-2 items-center justify-center w-full">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSave("draft")}
                          data-testid="button-create-bill-draft"
                        >
                          <Save className="w-4 h-4" /> Save as Draft
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-destructive"
                          onClick={() =>
                            updateCurrentBill({ items: [], discountOnBill: 0 })
                          }
                          data-testid="button-reset-bill"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Reset Bill
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Search & Add Products Modal */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-2xl">
              Search & Add Products
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 border-b sticky top-20 bg-background z-10">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by product name, barcode, or SKU..."
                className="pl-10 py-3 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                data-testid="input-product-search"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filteredProducts?.length || 0} product(s) available
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    onClick={() => {
                      addProductToBill(product);
                      setShowSearch(false);
                    }}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all active:scale-95 group flex flex-col"
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardContent className="p-4 flex flex-col gap-3 h-full justify-between">
                      <div>
                        <h3
                          className="font-semibold text-sm line-clamp-2"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mt-2">
                          {product.color && (
                            <span className="bg-primary/10 text-primary/70 px-2 py-1 rounded font-medium">
                              {product.color}
                            </span>
                          )}
                          {product.size && (
                            <span className="bg-primary/10 text-primary/70 px-2 py-1 rounded font-medium">
                              {product.size}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Barcode:{" "}
                          <span className="font-mono">{product.barcode}</span>
                        </p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU:{" "}
                            <span className="font-mono">{product.sku}</span>
                          </p>
                        )}
                      </div>

                      <div className="bg-muted rounded overflow-hidden flex items-center justify-center w-full h-40">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-40 h-40 object-cover"
                          />
                        ) : (
                          <div className="text-center p-1 w-full">
                            <p className="text-xs text-muted-foreground">
                              Barcode
                            </p>
                            <p className="font-mono text-xs font-semibold truncate px-1">
                              {product.barcode}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-primary block">
                            PKR {product.price.toFixed(2)}
                          </span>
                          <p
                            className={`text-xs font-medium ${
                              product.stock > 10
                                ? "text-green-600"
                                : product.stock > 0
                                  ? "text-orange-600"
                                  : "text-destructive"
                            }`}
                          >
                            {product.stock} in stock
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No products found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try searching with different terms
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Start typing to search products
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Search by name, barcode, or SKU
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
