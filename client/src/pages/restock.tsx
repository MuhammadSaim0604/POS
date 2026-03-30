import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useMedicines } from "@/hooks/use-medicines";
import { useCategories } from "@/hooks/use-categories";
import { useCreatePurchase, usePurchases } from "@/hooks/use-purchases";
import { useToast } from "@/hooks/use-toast";
import { useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Truck,
  History,
  Package,
  Plus,
  Search,
  User,
  ArrowRight,
  ScanBarcode,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Grid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "wouter";

export default function Restock() {
  const { data: medicines } = useMedicines();
  const { data: categories } = useCategories();
  const { data: restocks, isLoading: isLoadingRestocks } = usePurchases();
  const createRestock = useCreatePurchase();
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();

  // Selection & Form State
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState(0);
  const [actualPrice, setActualPrice] = useState(0);
  const [itemsPerPacket, setItemsPerPacket] = useState(1);
  const [expiryDate, setExpiryDate] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Handle URL barcode search
  useEffect(() => {
    const params = new URLSearchParams(search);
    const barcode = params.get("barcode");
    if (barcode && medicines) {
      const medicine = medicines.find((p) => p.barcode === barcode);
      if (medicine) {
        setSelectedMedicine(medicine.id);
        setIsScanning(false);
      }
    }
  }, [search, medicines]);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showMedicineNotFound, setShowMedicineNotFound] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill fields when medicine selection changes
  useEffect(() => {
    if (selectedMedicine && medicines) {
      const medicine = medicines.find((p) => p.id === selectedMedicine);
      if (medicine) {
        setPrice(medicine.price);
        setActualPrice(medicine.actualPrice || 0);
        setItemsPerPacket(medicine.itemsPerPacket || 1);
        if (medicine.supplierName) setSupplier(medicine.supplierName);
        if (medicine.expiryDate) {
          // Format to YYYY-MM-DD for the date input
          const d = new Date(medicine.expiryDate as string);
          if (!isNaN(d.getTime())) {
            setExpiryDate(d.toISOString().split("T")[0]);
          }
        }
        setIsScanning(false);
      }
    }
  }, [selectedMedicine, medicines]);

  // Handle Barcode Focus
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        if (document.activeElement !== barcodeInputRef.current) {
          barcodeInputRef.current?.focus();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const medicine = medicines?.find((p) => p.barcode === barcodeInput);
    if (medicine) {
      setSelectedMedicine(medicine.id);
      setBarcodeInput("");
      toast({
        title: "Medicine Identified",
        description: `Selected: ${medicine.name}`,
      });
    } else {
      setShowMedicineNotFound(true);
      setBarcodeInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    try {
      await createRestock.mutateAsync({
        medicineId: selectedMedicine,
        quantity: Number(quantity),
        // itemsPerPacket is for calculation only — NOT saved in medicine's itemsPerPacket field
        itemsPerPacket: Number(itemsPerPacket),
        supplier,
        // These replace DB values
        price: Number(price),
        actualPrice: Number(actualPrice),
        expiryDate: expiryDate || undefined,
      });
      toast({
        title: "Stock Successfully Updated",
        description: `Added ${quantity} packets (${quantity * Number(itemsPerPacket)} items) to inventory.`,
        className: "bg-green-600 text-white border-none",
      });
      // Reset form
      setSelectedMedicine("");
      setQuantity(1);
      setSupplier("");
      setPrice(0);
      setItemsPerPacket(1);
      setActualPrice(0);
      setExpiryDate("");
      setIsScanning(true);

      // Clear URL parameters
      if (search) {
        setLocation("/restock");
      }
    } catch (err) {
      toast({
        title: "Failed to restock",
        variant: "destructive",
      });
    }
  };

  const filteredMedicines = medicines?.filter(
    (p) =>
      p.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      p.barcode.includes(medicineSearch) ||
      (p.categoryId &&
        p.categoryId.toLowerCase().includes(medicineSearch.toLowerCase())),
  );

  const selectedMedicineData = medicines?.find(
    (p) => p.id === selectedMedicine,
  );
  const selectedCategoryName =
    categories?.find((c) => c.id === selectedMedicineData?.categoryId)?.name ||
    "Uncategorized";

  return (
    <Layout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {showHistory
                ? "Restock History"
                : selectedMedicine
                  ? "Restock Entry"
                  : "Inventory Restock"}
            </h2>
            <p className="text-muted-foreground">
              {showHistory
                ? "Detailed log of all inventory arrivals."
                : selectedMedicine
                  ? `Processing stock arrival for: ${selectedMedicineData?.name}`
                  : "Manage incoming stock via barcode scanning or manual selection."}
            </p>
          </div>
          <div className="flex gap-3">
            {!showHistory && !selectedMedicine && (
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-9 px-3"
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-9 px-3"
                  onClick={() => setViewMode("card")}
                  title="Card view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            )}
            {!showHistory && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="gap-2 font-semibold"
              >
                <History className="w-5 h-5" /> View History
              </Button>
            )}
            {showHistory && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(false)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Restock
              </Button>
            )}
            {!selectedMedicine && !showHistory && (
              <Button
                variant={isScanning ? "destructive" : "default"}
                size="lg"
                className="gap-2 font-bold shadow-lg h-12 transition-all hover-elevate"
                onClick={() => setIsScanning(!isScanning)}
              >
                <ScanBarcode className="w-5 h-5" />
                {isScanning ? "Stop Scanning" : "Scan Medicines"}
              </Button>
            )}
            {selectedMedicine && !showHistory && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSelectedMedicine("");
                  setIsScanning(true);
                  if (search) {
                    setLocation("/restock");
                  }
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Cancel Restock
              </Button>
            )}
          </div>
        </div>

        {showHistory ? (
          <Card className="shadow-lg border-0 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>History Log</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  className="pl-9 bg-background/50 border-muted"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Date & Time</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">Added Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRestocks
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell
                            colSpan={4}
                            className="h-12 animate-pulse bg-muted/20"
                          />
                        </TableRow>
                      ))
                    : restocks
                        ?.filter((p) => {
                          const medicine = medicines?.find(
                            (prod) => prod.id === p.medicineId,
                          );
                          return `${medicine?.name} ${p.supplier}`
                            .toLowerCase()
                            .includes(searchHistory.toLowerCase());
                        })
                        .map((p) => {
                          const medicine = medicines?.find(
                            (prod) => prod.id === p.medicineId,
                          );
                          return (
                            <TableRow key={p.id} className="hover:bg-muted/10">
                              <TableCell className="pl-6 font-mono text-xs">
                                {format(new Date(p.date), "MMM dd, yyyy HH:mm")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {medicine?.name || "Deleted"}
                              </TableCell>
                              <TableCell className="text-muted-foreground italic">
                                {p.supplier || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-600 border-green-500/20 font-bold px-3"
                                >
                                  +{p.quantity}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : !selectedMedicine ? (
          <>
            {isScanning && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 animate-pulse flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-full animate-bounce">
                    <ScanBarcode className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">
                      Scanning started...
                    </h3>
                    <p className="text-sm text-primary/70 font-medium">
                      Point your scanner at a medicine barcode to auto-fill
                      details.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleBarcodeSubmit}>
                  <Input
                    ref={barcodeInputRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Waiting for scan..."
                    className="w-64 bg-background border-primary/30 focus-visible:ring-primary shadow-sm"
                    autoComplete="off"
                  />
                </form>
              </div>
            )}
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines..."
                  className="pl-9 h-10 bg-card"
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />
              </div>

              {viewMode === "table" ? (
                <Card className="overflow-hidden border shadow-sm">
                  <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-900 text-white">
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-8">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Medicine Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Barcode</th>
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">Stock</th>
                          <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider w-20">Restock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedicines?.map((medicine, idx) => {
                          const ipp = medicine.itemsPerPacket || 1;
                          const total = medicine.totalItemsInStock || medicine.stock * ipp;
                          const pkts = Math.floor(total / ipp);
                          const rem = total % ipp;
                          const stockLabel = ipp === 1
                            ? `${total}`
                            : rem === 0
                              ? `${pkts} pkts`
                              : `${pkts} pkts ${rem} items`;
                          const isLow = medicine.stock < (medicine.lowStockThreshold || 10);
                          return (
                            <tr
                              key={medicine.id}
                              className={`border-b transition-colors cursor-pointer ${
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                              } hover:bg-primary/5`}
                              onClick={() => setSelectedMedicine(medicine.id)}
                            >
                              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm">{medicine.name}</p>
                                {medicine.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-xs">{medicine.description}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="font-mono text-xs text-muted-foreground">{medicine.barcode || "—"}</span>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">{medicine.supplierName || "—"}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs font-semibold ${isLow ? "text-destructive" : "text-green-600"}`}>
                                  {stockLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-bold text-sm text-primary font-mono">PKR {medicine.price.toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => { e.stopPropagation(); setSelectedMedicine(medicine.id); }}
                                >
                                  <Plus className="h-3 w-3" /> Add
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredMedicines?.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                              <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                              <p>No medicines found.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[calc(100vh-17rem)] pr-2">
                {filteredMedicines?.map((medicine) => (
                  <Card
                    key={medicine.id}
                    onClick={() => setSelectedMedicine(medicine.id)}
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all active:scale-95 group flex flex-col bg-card"
                  >
                    <CardContent className="p-3 flex flex-col gap-3 h-full justify-between">
                      <div>
                        <h3
                          className="font-semibold text-xs line-clamp-2"
                          title={medicine.name}
                        >
                          {medicine.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Stock:{" "}
                          <span
                            className={
                              medicine.stock < 5 ? "text-red-500 font-bold" : ""
                            }
                          >
                            {(() => {
                              const ipp = medicine.itemsPerPacket || 1;
                              const total =
                                medicine.totalItemsInStock ||
                                medicine.stock * ipp;
                              const pkts = Math.floor(total / ipp);
                              const rem = total % ipp;
                              return ipp === 1
                                ? `${total}`
                                : rem === 0
                                  ? `${pkts} pkts`
                                  : `${pkts} pkts ${rem} items`;
                            })()}
                          </span>
                        </p>
                      </div>

                      <div className="bg-muted rounded overflow-hidden flex items-center justify-center w-20 h-20 mx-auto">
                        {medicine.image ? (
                          <img
                            src={medicine.image}
                            alt={medicine.name}
                            className="w-20 h-20 object-cover"
                          />
                        ) : (
                          <div className="text-center p-1">
                            <p className="text-xs text-muted-foreground">
                              Barcode
                            </p>
                            <p className="font-mono text-[10px] font-semibold truncate px-1">
                              {medicine.barcode}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-primary">
                          PKR {medicine.price.toFixed(2)}
                        </span>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7 rounded-full group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredMedicines?.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <p>No medicines found.</p>
                  </div>
                )}
              </div>
              )}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="p-8 bg-card rounded-3xl border shadow-sm space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="bg-muted rounded-2xl overflow-hidden w-40 h-40 flex-shrink-0 flex items-center justify-center shadow-inner border">
                      {selectedMedicineData?.image ? (
                        <img
                          src={selectedMedicineData.image}
                          alt={selectedMedicineData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">
                            No Image
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Medicine Specifications
                      </p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Category
                          </span>
                          <span className="font-semibold">
                            {selectedCategoryName}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Barcode
                          </span>
                          <span className="font-mono font-semibold">
                            {selectedMedicineData?.barcode}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Original Price
                          </span>
                          <span className="font-semibold text-primary">
                            PKR {selectedMedicineData?.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Current Stock
                          </span>
                          <Badge
                            variant="secondary"
                            className="w-fit font-bold text-[10px] h-5"
                          >
                            {(() => {
                              const m = selectedMedicineData;
                              if (!m) return "-";
                              const ipp = m.itemsPerPacket || 1;
                              const total =
                                m.totalItemsInStock || m.stock * ipp;
                              const pkts = Math.floor(total / ipp);
                              const rem = total % ipp;
                              return ipp === 1
                                ? `${total}`
                                : rem === 0
                                  ? `${pkts} pkts`
                                  : `${pkts} pkts ${rem} items`;
                            })()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(selectedMedicineData?.color ||
                    selectedMedicineData?.size) && (
                    <div className="grid grid-cols-2 gap-x-8 text-sm pt-2 px-8">
                      {selectedMedicineData?.color && (
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Color
                          </span>
                          <span className="font-semibold">
                            {selectedMedicineData.color}
                          </span>
                        </div>
                      )}
                      {selectedMedicineData?.size && (
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Size
                          </span>
                          <span className="font-semibold">
                            {selectedMedicineData.size}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card p-10 rounded-3xl border shadow-sm self-start">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-bold">
                        Number of Packets
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="h-10 bg-background font-mono text-lg border-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        Items per Packet
                        <span className="text-[10px] font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                          for calculation only
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={itemsPerPacket}
                        onChange={(e) =>
                          setItemsPerPacket(Number(e.target.value))
                        }
                        className="h-10 bg-background font-mono text-base border-2"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Used to calculate items added ({quantity} pkts ×{" "}
                        {itemsPerPacket} ={" "}
                        <strong>{quantity * itemsPerPacket} items</strong>).
                        Does not change the medicine's packing unit in the
                        database.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-4 h-4 text-[10px] font-bold text-muted-foreground flex items-center justify-center">
                          PKR
                        </span>
                        Purchase Price (Actual)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={actualPrice}
                        onChange={(e) => setActualPrice(Number(e.target.value))}
                        className="h-10 bg-background font-mono text-base border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-4 h-4 text-[10px] font-bold text-muted-foreground flex items-center justify-center">
                          PKR
                        </span>
                        Retail Price (Selling)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="h-10 bg-background font-mono text-base border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Supplier
                      </Label>
                      <Input
                        placeholder="Enter supplier name"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="h-10 bg-background text-base border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        Expiry Date
                      </Label>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="h-10 bg-background text-base border-2"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Replaces existing expiry date in the database.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="default"
                      className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 active-elevate-2 transition-all rounded-xl"
                      disabled={createRestock.isPending}
                    >
                      {createRestock.isPending ? (
                        "Processing..."
                      ) : (
                        <span className="flex items-center gap-2">
                          Complete Restock <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showMedicineNotFound}
        onOpenChange={setShowMedicineNotFound}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-2xl">
              <AlertCircle className="w-6 h-6" />
              Medicine Not Found
            </DialogTitle>
            <DialogDescription className="text-lg">
              The barcode you scanned doesn't match any medicine in our
              database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowMedicineNotFound(false)}
              className="rounded-xl px-8"
            >
              Try Again
            </Button>
            <Link href="/inventory">
              <Button
                size="lg"
                onClick={() => setShowMedicineNotFound(false)}
                className="rounded-xl px-8"
              >
                Add New Medicine
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
