import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useProducts } from "@/hooks/use-products";
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
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: restocks, isLoading: isLoadingRestocks } = usePurchases();
  const createRestock = useCreatePurchase();
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();

  // Selection & Form State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState(0);
  const [actualPrice, setActualPrice] = useState(0);
  const [itemsPerPacket, setItemsPerPacket] = useState(1);
  const [searchHistory, setSearchHistory] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Handle URL barcode search
  useEffect(() => {
    const params = new URLSearchParams(search);
    const barcode = params.get("barcode");
    if (barcode && products) {
      const medicine = products.find((p) => p.barcode === barcode);
      if (medicine) {
        setSelectedProduct(medicine.id);
        setIsScanning(false);
      }
    }
  }, [search, products]);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showProductNotFound, setShowProductNotFound] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill fields when medicine selection changes
  useEffect(() => {
    if (selectedProduct && products) {
      const medicine = products.find((p) => p.id === selectedProduct);
      if (medicine) {
        setPrice(medicine.price);
        setActualPrice(medicine.actualPrice || 0);
        setItemsPerPacket(medicine.itemsPerPacket || 1);
        if (medicine.supplierName) setSupplier(medicine.supplierName);
        setIsScanning(false);
      }
    }
  }, [selectedProduct, products]);

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

    const medicine = products?.find((p) => p.barcode === barcodeInput);
    if (medicine) {
      setSelectedProduct(medicine.id);
      setBarcodeInput("");
      toast({
        title: "Medicine Identified",
        description: `Selected: ${medicine.name}`,
      });
    } else {
      setShowProductNotFound(true);
      setBarcodeInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await createRestock.mutateAsync({
        productId: selectedProduct,
        quantity: Number(quantity),
        supplier,
      });
      toast({
        title: "Stock Successfully Updated",
        description: `Added ${quantity} units to inventory.`,
        className: "bg-green-600 text-white border-none",
      });
      // Reset form
      setSelectedProduct("");
      setQuantity(1);
      setSupplier("");
      setPrice(0);
      setItemsPerPacket(1);
      setActualPrice(0);
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

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch) ||
      (p.categoryId &&
        p.categoryId.toLowerCase().includes(productSearch.toLowerCase())),
  );

  const selectedProductData = products?.find((p) => p.id === selectedProduct);
  const selectedCategoryName =
    categories?.find((c) => c.id === selectedProductData?.categoryId)?.name ||
    "Uncategorized";

  return (
    <Layout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {showHistory
                ? "Restock History"
                : selectedProduct
                  ? "Restock Entry"
                  : "Inventory Restock"}
            </h2>
            <p className="text-muted-foreground">
              {showHistory
                ? "Detailed log of all inventory arrivals."
                : selectedProduct
                  ? `Processing stock arrival for: ${selectedProductData?.name}`
                  : "Manage incoming stock via barcode scanning or manual selection."}
            </p>
          </div>
          <div className="flex gap-3">
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
            {!selectedProduct && !showHistory && (
              <Button
                variant={isScanning ? "destructive" : "default"}
                size="lg"
                className="gap-2 font-bold shadow-lg h-12 transition-all hover-elevate"
                onClick={() => setIsScanning(!isScanning)}
              >
                <ScanBarcode className="w-5 h-5" />
                {isScanning ? "Stop Scanning" : "Scan Products"}
              </Button>
            )}
            {selectedProduct && !showHistory && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSelectedProduct("");
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
                          const medicine = products?.find(
                            (prod) => prod.id === p.productId,
                          );
                          return `${medicine?.name} ${p.supplier}`
                            .toLowerCase()
                            .includes(searchHistory.toLowerCase());
                        })
                        .map((p) => {
                          const medicine = products?.find(
                            (prod) => prod.id === p.productId,
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
        ) : !selectedProduct ? (
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
                  placeholder="Search products..."
                  className="pl-9 h-10 bg-card"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[calc(100vh-20rem)] pr-2">
                {filteredProducts?.map((medicine) => (
                  <Card
                    key={medicine.id}
                    onClick={() => setSelectedProduct(medicine.id)}
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
                            {medicine.stock}
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
                {filteredProducts?.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <p>No products found.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="p-8 bg-card rounded-3xl border shadow-sm space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="bg-muted rounded-2xl overflow-hidden w-40 h-40 flex-shrink-0 flex items-center justify-center shadow-inner border">
                      {selectedProductData?.image ? (
                        <img
                          src={selectedProductData.image}
                          alt={selectedProductData.name}
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
                            {selectedProductData?.barcode}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Original Price
                          </span>
                          <span className="font-semibold text-primary">
                            PKR {selectedProductData?.price.toFixed(2)}
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
                            {selectedProductData?.stock} units
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(selectedProductData?.color ||
                    selectedProductData?.size) && (
                    <div className="grid grid-cols-2 gap-x-8 text-sm pt-2 px-8">
                      {selectedProductData?.color && (
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Color
                          </span>
                          <span className="font-semibold">
                            {selectedProductData.color}
                          </span>
                        </div>
                      )}
                      {selectedProductData?.size && (
                        <div className="flex flex-col gap-0.5 border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">
                            Size
                          </span>
                          <span className="font-semibold">
                            {selectedProductData.size}
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
                      </Label>
                      <Input
                        type="number"
                        value={itemsPerPacket}
                        onChange={(e) =>
                          setItemsPerPacket(Number(e.target.value))
                        }
                        className="h-10 bg-background font-mono text-base border-2"
                      />
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

      <Dialog open={showProductNotFound} onOpenChange={setShowProductNotFound}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-2xl">
              <AlertCircle className="w-6 h-6" />
              Medicine Not Found
            </DialogTitle>
            <DialogDescription className="text-lg">
              The barcode you scanned doesn't match any medicine in our database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-end pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowProductNotFound(false)}
              className="rounded-xl px-8"
            >
              Try Again
            </Button>
            <Link href="/inventory">
              <Button
                size="lg"
                onClick={() => setShowProductNotFound(false)}
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
