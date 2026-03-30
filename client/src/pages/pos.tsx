import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useMedicines, useMedicineByBarcode } from "@/hooks/use-medicines";
import { useCreateSale } from "@/hooks/use-sales";
import { type Medicine, type SaleItem } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ScanBarcode, Trash2, Plus, Minus, CreditCard, ShoppingCart, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends SaleItem {
  stockMax: number;
}

export default function POS() {
  const { data: medicines } = useMedicines();
  const createSale = useCreateSale();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount and keep focused
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (document.activeElement?.tagName !== "INPUT" || document.activeElement === barcodeInputRef.current) {
        barcodeInputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focusInterval);
  }, []);

  const addToCart = (medicine: Medicine) => {
    const totalAvail = medicine.totalItemsInStock || (medicine.stock * (medicine.itemsPerPacket || 1));
    if (totalAvail <= 0) {
      toast({
        title: "Out of Stock",
        description: `${medicine.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.id);
      if (existing) {
        if (existing.quantity >= totalAvail) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${totalAvail} items available.`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          medicineId: medicine.id,
          name: medicine.name,
          priceAtSale: medicine.price,
          quantity: 1,
          stockMax: totalAvail,
        },
      ];
    });
    toast({
      title: "Added to cart",
      description: medicine.name,
      duration: 1000,
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.medicineId === medicineId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > item.stockMax) {
            toast({
              title: "Stock Limit",
              description: "Cannot add more than available stock.",
              variant: "destructive",
            });
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicine = medicines?.find((p) => p.barcode === barcodeInput);
    if (medicine) {
      addToCart(medicine);
      setBarcodeInput("");
    } else {
      toast({
        title: "Medicine Not Found",
        description: `No medicine with barcode: ${barcodeInput}`,
        variant: "destructive",
      });
      setBarcodeInput("");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const total = cart.reduce((acc, item) => acc + item.priceAtSale * item.quantity, 0);
      await createSale.mutateAsync({
        items: cart.map(({ stockMax, ...item }) => item),
        total,
      });
      setCart([]);
      toast({
        title: "Sale Completed!",
        description: `Total: PKR ${total.toFixed(2)}`,
        className: "bg-green-600 text-white border-none",
      });
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Could not process sale.",
        variant: "destructive",
      });
    }
  };

  const filteredMedicines = medicines?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.priceAtSale * item.quantity, 0);

  return (
    <Layout>
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Medicine Selection Area */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Hidden Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Input
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-48 opacity-50 focus:opacity-100 transition-opacity"
                placeholder="Scan Barcode..."
                autoComplete="off"
              />
              <ScanBarcode className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2">
            {filteredMedicines?.map((medicine) => (
              <Card
                key={medicine.id}
                onClick={() => addToCart(medicine)}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all active:scale-95 group flex flex-col"
              >
                <CardContent className="p-3 flex flex-col gap-3 h-full justify-between">
                  <div>
                    <h3 className="font-semibold text-xs line-clamp-2" title={medicine.name}>
                      {medicine.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const ipp = medicine.itemsPerPacket || 1;
                        const total = medicine.totalItemsInStock || (medicine.stock * ipp);
                        const pkts = Math.floor(total / ipp);
                        const rem = total % ipp;
                        const display = ipp === 1 ? `${total}` : rem === 0 ? `${pkts} pkts` : `${pkts} pkts ${rem}`;
                        return <span className={total < 5 ? "text-red-500 font-bold" : ""}>{display}</span>;
                      })()}
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
                        <p className="text-xs text-muted-foreground">Barcode</p>
                        <p className="font-mono text-xs font-semibold truncate px-1">
                          {medicine.barcode}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-primary">
                      PKR {medicine.price.toFixed(2)}
                    </span>
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
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
        </div>

        {/* Cart Sidebar */}
        <div className="flex flex-col h-full bg-card rounded-xl border shadow-lg overflow-hidden">
          <div className="p-4 bg-muted/30 border-b">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Current Order
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.medicineId}
                className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm animate-enter"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    PKR {item.priceAtSale.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.medicineId, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.medicineId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                    onClick={() => removeFromCart(item.medicineId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ScanBarcode className="w-16 h-16 mb-4" />
                <p>Scan items or select from list</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/30 border-t space-y-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Subtotal</span>
              <span>PKR {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-primary">
              <span>Total</span>
              <span>PKR {cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || createSale.isPending}
            >
              {createSale.isPending ? "Processing..." : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" /> Checkout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
