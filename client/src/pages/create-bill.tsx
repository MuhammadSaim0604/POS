import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { useMedicines } from "@/hooks/use-medicines";
import { useCreateBill, useUpdateBill, useBill } from "@/hooks/use-bills";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Search,
  User,
  FileText,
  X,
  PlusCircle,
  MinusCircle,
  Calculator,
  Barcode,
  Package,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type Medicine, type BillItem, formatStock } from "@shared/schema";
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

interface CustomItemForm {
  medicineName: string;
  pricePerItem: number;
  itemsPerPacket: number;
  qty: number;
  discountPerItem: number;
}

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.toLowerCase().split("+").map((p) => p.trim());
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");
  const keyPart = parts.find((p) => !["ctrl", "shift", "alt", "meta"].includes(p)) || "";
  const eventKey = e.key.toLowerCase();
  let keyMatches = false;
  if (keyPart === "space") keyMatches = e.key === " ";
  else if (keyPart === "enter") keyMatches = e.key === "Enter";
  else keyMatches = eventKey === keyPart;
  return e.ctrlKey === needsCtrl && e.shiftKey === needsShift && e.altKey === needsAlt && keyMatches;
}

export default function CreateBill() {
  const { data: medicines } = useMedicines();
  const { data: categories } = useCategories();
  const createBillMutation = useCreateBill();
  const updateBillMutation = useUpdateBill();
  const { toast } = useToast();
  const { settings } = useSettings();

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

  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState<CustomItemForm>({
    medicineName: "",
    pricePerItem: 0,
    itemsPerPacket: 1,
    qty: 1,
    discountPerItem: 0,
  });
  const [printBill, setPrintBill] = useState<any | null>(null);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  const discountInputRef = useRef<HTMLInputElement>(null);
  const searchListRef = useRef<HTMLDivElement>(null);

  // Stable refs so shortcut handler doesn't need to re-register on every state change
  const showSearchRef = useRef(false);
  const showCustomItemRef = useRef(false);
  const addNewBillRef = useRef<() => void>(() => {});
  const handleSaveRef = useRef<(s: "draft" | "completed" | "printed") => void>(() => {});
  const updateCurrentBillRef = useRef<(u: Partial<ActiveBill>) => void>(() => {});
  const setIsScannerActiveRef = useRef(setIsScannerActive);

  useEffect(() => {
    if (editBill && editBillId && !isLoadingBill) {
      const billToLoad: ActiveBill = {
        id: editBillId,
        customerName: editBill.customerName || "",
        customerPhone: editBill.customerPhone || "",
        customerBusinessName: editBill.customerBusinessName || "",
        customerCity: editBill.customerCity || "",
        customerAddress: editBill.customerAddress || "",
        biltyNo: editBill.biltyNo || "",
        remarks: editBill.remarks || "",
        items: editBill.items,
        discountOnBill: editBill.discountOnBill || 0,
        notes: editBill.notes || "",
      };
      setActiveBills([billToLoad]);
      setActiveTab(editBillId);
    }
  }, [editBill, editBillId, isLoadingBill]);

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

  useEffect(() => {
    if (!editBillId) {
      localStorage.setItem("activeBills", JSON.stringify(activeBills));
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeBills, activeTab, editBillId]);

  useEffect(() => {
    if (isScannerActive) barcodeInputRef.current?.focus();
  }, [isScannerActive]);

  // Keep stable refs in sync for the shortcut handler
  useEffect(() => { showSearchRef.current = showSearch; }, [showSearch]);
  useEffect(() => { showCustomItemRef.current = showCustomItem; }, [showCustomItem]);

  // Reset search selection when query changes
  useEffect(() => { setSelectedSearchIndex(0); }, [searchQuery]);

  // Auto-scroll the highlighted row into view when navigating with arrow keys
  useEffect(() => {
    if (!showSearch) return;
    const row = searchListRef.current?.querySelector<HTMLElement>(`[data-search-row="${selectedSearchIndex}"]`);
    if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedSearchIndex, showSearch]);

  // Global keyboard shortcut handler
  useEffect(() => {
    const s = settings;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || "";
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
        (e.target as HTMLElement)?.isContentEditable;

      // Ctrl+Z → open search modal
      if (matchesShortcut(e, s?.shortcutSearchMedicines || "Ctrl+Z")) {
        e.preventDefault();
        if (!showSearchRef.current && !showCustomItemRef.current) {
          setShowSearch(true);
          setSearchQuery("");
        }
        return;
      }
      // Ctrl+S → toggle scanner
      if (matchesShortcut(e, s?.shortcutScanner || "Ctrl+S")) {
        e.preventDefault();
        setIsScannerActive((prev) => !prev);
        return;
      }
      // Ctrl+C → custom item (only when NOT in a text input to preserve copy)
      if (matchesShortcut(e, s?.shortcutCustomItem || "Ctrl+C") && !inInput) {
        e.preventDefault();
        if (!showCustomItemRef.current && !showSearchRef.current) {
          setCustomItem({ medicineName: "", pricePerItem: 0, itemsPerPacket: 1, qty: 1, discountPerItem: 0 });
          setShowCustomItem(true);
        }
        return;
      }
      // Ctrl+Space → new bill tab
      if (matchesShortcut(e, s?.shortcutNewBill || "Ctrl+Space")) {
        e.preventDefault();
        addNewBillRef.current();
        return;
      }
      // Ctrl+Enter → create bill
      if (matchesShortcut(e, s?.shortcutCreateBill || "Ctrl+Enter")) {
        e.preventDefault();
        handleSaveRef.current("printed");
        return;
      }
      // Ctrl+D → focus discount input
      if (matchesShortcut(e, s?.shortcutDiscount || "Ctrl+D")) {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }
      // Ctrl+R → reset bill
      if (matchesShortcut(e, s?.shortcutResetBill || "Ctrl+R")) {
        e.preventDefault();
        updateCurrentBillRef.current({ items: [], discountOnBill: 0 });
        return;
      }
      // Ctrl+Shift+S → save draft
      if (matchesShortcut(e, s?.shortcutDraftBill || "Ctrl+Shift+S")) {
        e.preventDefault();
        handleSaveRef.current("draft");
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [settings]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      e.preventDefault();
      const medicine = medicines?.find(
        (p: Medicine) => p.barcode === barcodeInput.trim(),
      );
      if (medicine) {
        addMedicineToBill(medicine);
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
        toast({
          title: "Medicine Added",
          description: medicine.name,
          duration: 1000,
        });
      } else {
        toast({
          title: "Medicine Not Found",
          description: `No medicine found with barcode: ${barcodeInput}`,
          variant: "destructive",
        });
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
      }
    }
  };

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
    if (activeTab === id) setActiveTab(newBills[0].id);
  };

  const updateCurrentBill = (updates: Partial<ActiveBill>) => {
    setActiveBills(
      activeBills.map((b) => (b.id === activeTab ? { ...b, ...updates } : b)),
    );
  };

  const addMedicineToBill = (medicine: Medicine) => {
    const existingItemIndex = currentBill.items.findIndex(
      (item) => item.medicineId === medicine.id,
    );
    if (existingItemIndex > -1) {
      const updatedItems = [...currentBill.items];
      updatedItems[existingItemIndex].qty += medicine.itemsPerPacket || 1; // add 1 packet worth
      updateCurrentBill({ items: updatedItems });
    } else {
      const newItem: BillItem = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        itemsPerPacket: medicine.itemsPerPacket || 1,
        pricePerItem: medicine.price,
        qty: medicine.itemsPerPacket || 1, // default: 1 packet worth of items
        discountPerItem: 0,
      };
      updateCurrentBill({ items: [...currentBill.items, newItem] });
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const addCustomItemToBill = () => {
    if (!customItem.medicineName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter item name.",
        variant: "destructive",
      });
      return;
    }
    const newItem: BillItem = {
      medicineId: "",
      medicineName: customItem.medicineName.trim(),
      itemsPerPacket: customItem.itemsPerPacket || 1,
      pricePerItem: customItem.pricePerItem || 0,
      qty: customItem.qty || 1,
      discountPerItem: customItem.discountPerItem || 0,
    };
    updateCurrentBill({ items: [...currentBill.items, newItem] });
    setShowCustomItem(false);
    setCustomItem({
      medicineName: "",
      pricePerItem: 0,
      itemsPerPacket: 1,
      qty: 1,
      discountPerItem: 0,
    });
    toast({
      title: "Custom item added",
      description: newItem.medicineName,
      duration: 1000,
    });
  };

  const removeMedicineFromBill = (index: number) => {
    updateCurrentBill({
      items: currentBill.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, updates: Partial<BillItem>) => {
    const updatedItems = [...currentBill.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    updateCurrentBill({ items: updatedItems });
  };

  // subtotal = (price - discount) * qty  [qty is total individual items]
  const calculateSubtotal = (item: BillItem) => {
    return (item.pricePerItem - (item.discountPerItem || 0)) * item.qty;
  };

  const calculateBillTotal = () => {
    const itemsTotal = currentBill.items.reduce(
      (sum, item) => sum + calculateSubtotal(item),
      0,
    );
    return Math.max(0, itemsTotal - currentBill.discountOnBill);
  };

  const handleSave = async (status: "draft" | "completed" | "printed") => {
    if (currentBill.items.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Please add at least one item.",
        variant: "destructive",
      });
      return;
    }
    try {
      const billData = {
        customerName: currentBill.customerName || "",
        customerPhone: currentBill.customerPhone || "",
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
          description: "Bill updated successfully",
        });
      } else {
        savedBill = await createBillMutation.mutateAsync(billData);
        toast({
          title: status === "draft" ? "Draft Saved" : "Bill Created",
          description: "Bill processed successfully",
        });
      }

      if (status === "printed" && savedBill) {
        setPrintBill(savedBill);
        setTimeout(() => {
          const element = document.getElementById("bill-print-template");
          if (element) {
            const opt = {
              margin: 10,
              filename: `Bill-${savedBill.billNumber}.pdf`,
              image: { type: "jpeg" as const, quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: {
                unit: "mm" as const,
                format: "a4" as const,
                orientation: "portrait" as const,
              },
            };
            html2pdf()
              .from(element)
              .set(opt)
              .save()
              .then(() => setPrintBill(null));
          } else {
            setPrintBill(null);
          }
        }, 500);
      }

      if (status !== "draft" || (editBillId && currentBill.id === editBillId)) {
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

  // Sync function refs on every render so shortcuts always call the latest closures
  addNewBillRef.current = addNewBill;
  handleSaveRef.current = handleSave;
  updateCurrentBillRef.current = updateCurrentBill;

  const filteredMedicines = medicines?.filter(
    (p: Medicine) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode || "").includes(searchQuery) ||
      (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Create Bill</h2>
          <p className="text-muted-foreground">
            Process multiple customer orders. Scan barcodes or add medicines
            manually.
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
                <div
                  key={bill.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab(bill.id)}
                  onKeyDown={(e) => e.key === "Enter" && setActiveTab(bill.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium cursor-pointer select-none ${
                    activeTab === bill.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  <span>{bill.customerName || `Customer ${bill.id}`}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeBill(bill.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") removeBill(bill.id, e as any);
                    }}
                    className="hover:text-destructive transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
            <Button
              onClick={addNewBill}
              variant="outline"
              size="sm"
              className="gap-1 flex-shrink-0"
            >
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>

          {activeBills.map((bill) => (
            <TabsContent key={bill.id} value={bill.id} className="flex-1 mt-4">
              {/* Full-width content with padding at bottom for sticky summary bar */}
              <div className="space-y-4 pb-[130px]">
                {/* Bill Items — full width */}
                <Card className="w-full overflow-hidden">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex flex-row items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Bill Items
                        {bill.items.length > 0 && (
                          <span className="ml-1 text-xs bg-primary text-white rounded-full px-2 py-0.5 font-normal">
                            {bill.items.length}
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={isScannerActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsScannerActive(!isScannerActive)}
                          className={`gap-2 ${isScannerActive ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                        >
                          <Barcode className="w-4 h-4" />
                          {isScannerActive ? "Scanner Active" : "Scan"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSearch(true)}
                          className="gap-2"
                        >
                          <PlusCircle className="w-4 h-4" /> Add Medicine
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomItem({
                              medicineName: "",
                              pricePerItem: 0,
                              itemsPerPacket: 1,
                              qty: 1,
                              discountPerItem: 0,
                            });
                            setShowCustomItem(true);
                          }}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" /> Custom Item
                        </Button>
                      </div>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        className="absolute -left-96 top-0 w-96 h-0 opacity-0 focus:outline-none"
                        autoComplete="off"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-8">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">
                            Medicine / Item
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider w-32">
                            Price / Item
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider w-32">
                            Disc / Item
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider w-36">
                            Qty (Items)
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider w-32">
                            Subtotal
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, index) => {
                          const packets =
                            item.itemsPerPacket > 0
                              ? Math.floor(item.qty / item.itemsPerPacket)
                              : 0;
                          const remItems = item.qty % item.itemsPerPacket;
                          const subtotal = calculateSubtotal(item);
                          return (
                            <tr
                              key={index}
                              className={`border-b transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-primary/5`}
                            >
                              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm text-foreground">
                                  {item.medicineName}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {packets} pkt{packets !== 1 ? "s" : ""}
                                  {remItems > 0
                                    ? ` + ${remItems} item${remItems !== 1 ? "s" : ""}`
                                    : ""}
                                  {!item.medicineId && (
                                    <span className="ml-1 italic text-amber-600">
                                      (custom)
                                    </span>
                                  )}
                                </p>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <Input
                                  type="number"
                                  className="h-8 px-2 text-xs text-center w-28 mx-auto font-mono border-slate-200 focus-visible:ring-primary"
                                  value={item.pricePerItem}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      pricePerItem: Number(e.target.value),
                                    })
                                  }
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <Input
                                  type="number"
                                  className="h-8 px-2 text-xs text-center w-28 mx-auto font-mono border-slate-200 focus-visible:ring-primary"
                                  value={item.discountPerItem}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      discountPerItem: Number(e.target.value),
                                    })
                                  }
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-primary/10"
                                    onClick={() =>
                                      updateItem(index, {
                                        qty: Math.max(1, item.qty - 1),
                                      })
                                    }
                                  >
                                    <MinusCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                  <Input
                                    type="number"
                                    className="h-8 px-1 text-sm font-bold text-center w-14 border-slate-200 focus-visible:ring-primary"
                                    value={item.qty}
                                    min={1}
                                    onChange={(e) =>
                                      updateItem(index, {
                                        qty: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      })
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-primary/10"
                                    onClick={() =>
                                      updateItem(index, { qty: item.qty + 1 })
                                    }
                                  >
                                    <PlusCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-bold text-sm text-foreground font-mono">
                                  PKR {subtotal.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => removeMedicineFromBill(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {bill.items.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="h-36 text-center text-muted-foreground"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                <FileText className="w-10 h-10 opacity-20" />
                                <p className="text-sm">No items added yet.</p>
                                <p className="text-xs">
                                  Use "Add Medicine", "Custom Item", or scan a
                                  barcode.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Totals footer row — removed from inside table to preserve card border radius */}
                        {bill.items.length > 0 && (
                          <tr className="bg-slate-100 border-t-2 border-slate-300 hidden">
                            <td
                              colSpan={5}
                              className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                              Items Total
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-sm font-mono">
                              PKR{" "}
                              {bill.items
                                .reduce(
                                  (sum, i) => sum + calculateSubtotal(i),
                                  0,
                                )
                                .toFixed(2)}
                            </td>
                            <td />
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* Items total — outside table to preserve Card's rounded bottom corners */}
                    {bill.items.length > 0 && (
                      <div className="flex items-center justify-between bg-slate-100 border-t-2 border-slate-300 px-4 py-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Items Total
                        </span>
                        <span className="font-bold text-sm font-mono">
                          PKR{" "}
                          {bill.items
                            .reduce((sum, i) => sum + calculateSubtotal(i), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information — full width */}
                <Card className="w-full">
                  <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Customer Information
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (optional)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Name
                      </Label>
                      <Input
                        placeholder="Customer Name"
                        value={bill.customerName}
                        onChange={(e) =>
                          updateCurrentBill({ customerName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Business Name
                      </Label>
                      <Input
                        placeholder="Business Name"
                        value={bill.customerBusinessName}
                        onChange={(e) =>
                          updateCurrentBill({
                            customerBusinessName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Phone
                      </Label>
                      <Input
                        placeholder="Phone Number"
                        value={bill.customerPhone}
                        onChange={(e) =>
                          updateCurrentBill({ customerPhone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        City
                      </Label>
                      <Input
                        placeholder="City"
                        value={bill.customerCity}
                        onChange={(e) =>
                          updateCurrentBill({ customerCity: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Address / Adda
                      </Label>
                      <Input
                        placeholder="Address or Adda"
                        value={bill.customerAddress}
                        onChange={(e) =>
                          updateCurrentBill({ customerAddress: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Bilty No
                      </Label>
                      <Input
                        placeholder="Bilty Number"
                        value={bill.biltyNo}
                        onChange={(e) =>
                          updateCurrentBill({ biltyNo: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hidden print template */}
              <div className="hidden">
                <BillTemplate
                  bill={
                    printBill || {
                      id: "temp",
                      billNumber: "PREVIEW",
                      customerName: currentBill.customerName,
                      customerPhone: currentBill.customerPhone,
                      customerBusinessName: currentBill.customerBusinessName,
                      customerCity: currentBill.customerCity,
                      customerAddress: currentBill.customerAddress,
                      biltyNo: currentBill.biltyNo,
                      remarks: currentBill.remarks,
                      items: currentBill.items.map((item) => ({ ...item })),
                      totalAmount: calculateBillTotal(),
                      discountOnBill: currentBill.discountOnBill,
                      notes: currentBill.notes,
                      status: "printed",
                      date: new Date().toISOString(),
                    }
                  }
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-0 -mx-4 md:-mx-6 lg:-mx-8 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-20">
        <div className="px-4 md:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: totals */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  <Calculator className="w-3.5 h-3.5 inline mr-1" />
                  Discount on Bill:
                </Label>
                <Input
                  ref={discountInputRef}
                  type="number"
                  placeholder="0.00"
                  value={currentBill.discountOnBill}
                  onChange={(e) =>
                    updateCurrentBill({
                      discountOnBill: Number(e.target.value),
                    })
                  }
                  className="w-28 h-8 font-mono text-right text-sm border-slate-300"
                />
              </div>
              <div className="bg-black rounded px-4 py-1.5 flex flex-col items-end">
                <span className="text-red-500 font-bold text-2xl font-mono tracking-tight leading-tight">
                  PKR {calculateBillTotal().toFixed(2)}
                </span>
                <span className="text-slate-400 text-[11px] font-mono leading-tight">
                  {currentBill.items.reduce((sum, i) => sum + i.qty, 0)} items
                </span>
              </div>
            </div>
            {/* Right: action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() =>
                  updateCurrentBill({ items: [], discountOnBill: 0 })
                }
                data-testid="button-reset-bill"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={
                  createBillMutation.isPending || updateBillMutation.isPending
                }
                data-testid="button-create-bill-draft"
              >
                <Save className="w-4 h-4 mr-1" /> Save Draft
              </Button>
              <Button
                className="h-10 px-6 text-base font-semibold shadow-md"
                onClick={() => handleSave("printed")}
                disabled={
                  createBillMutation.isPending || updateBillMutation.isPending
                }
                data-testid="button-create-bill-print"
              >
                <FileText className="w-5 h-5 mr-2" /> Create Bill
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">Search & Add Medicines</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3 border-b sticky top-16 bg-background z-10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, barcode, or SKU... (↑↓ to navigate, Enter to add)"
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  const total = filteredMedicines?.length || 0;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedSearchIndex((i) => Math.min(i + 1, total - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedSearchIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const med = filteredMedicines?.[selectedSearchIndex];
                    if (med) {
                      addMedicineToBill(med);
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredMedicines?.length || 0} medicine(s) found
            </p>
          </div>
          <div className="flex-1 overflow-y-auto" ref={searchListRef}>
            {filteredMedicines && filteredMedicines.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-900 text-white">
                    <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider w-8">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider">Medicine Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider w-32 hidden sm:table-cell">Barcode / SKU</th>
                    <th className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider w-28">Stock</th>
                    <th className="px-3 py-2 text-right font-semibold text-xs uppercase tracking-wider w-28">Price / Item</th>
                    <th className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wider w-16">Add</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine: Medicine, idx: number) => {
                    const totalItems =
                      medicine.totalItemsInStock ||
                      medicine.stock * (medicine.itemsPerPacket || 1);
                    const ipp = medicine.itemsPerPacket || 1;
                    const isSelected = idx === selectedSearchIndex;
                    return (
                      <tr
                        key={medicine.id}
                        data-search-row={idx}
                        onClick={() => addMedicineToBill(medicine)}
                        className={`border-b cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-primary/30"
                            : idx % 2 === 0
                              ? "bg-white hover:bg-primary/5"
                              : "bg-slate-50 hover:bg-primary/5"
                        }`}
                        onMouseEnter={() => setSelectedSearchIndex(idx)}
                      >
                        <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">{idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-sm">{medicine.name}</p>
                          {medicine.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{medicine.description}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <p className="font-mono text-xs text-muted-foreground">{medicine.barcode || "—"}</p>
                          {medicine.sku && <p className="font-mono text-xs text-muted-foreground/70">{medicine.sku}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-semibold ${totalItems > 0 ? "text-green-600" : "text-destructive"}`}>
                            {formatStock(totalItems, ipp)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="font-bold text-sm text-primary font-mono">PKR {medicine.price.toFixed(2)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Button
                            size="icon"
                            variant={isSelected ? "default" : "secondary"}
                            className="h-7 w-7 rounded-full"
                            onClick={(e) => { e.stopPropagation(); addMedicineToBill(medicine); }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : searchQuery ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No medicines found</p>
                  <p className="text-sm text-muted-foreground">Try a different search or add a Custom Item</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Start typing to search</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Item Dialog */}
      <Dialog open={showCustomItem} onOpenChange={setShowCustomItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Use Tab or Enter to move between fields. Press Enter on the last field to add.</p>
            <div className="space-y-2">
              <Label>
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Panadol, Disprin..."
                value={customItem.medicineName}
                onChange={(e) =>
                  setCustomItem({ ...customItem, medicineName: e.target.value })
                }
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget.closest("div.space-y-4")?.querySelectorAll("input")[1] as HTMLInputElement)?.focus();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per Item (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customItem.pricePerItem}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      pricePerItem: Number(e.target.value),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget.closest("div.space-y-4")?.querySelectorAll("input")[2] as HTMLInputElement)?.focus();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount per Item</Label>
                <Input
                  type="number"
                  min="0"
                  value={customItem.discountPerItem}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      discountPerItem: Number(e.target.value),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget.closest("div.space-y-4")?.querySelectorAll("input")[3] as HTMLInputElement)?.focus();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Items per Packet</Label>
                <Input
                  type="number"
                  min="1"
                  value={customItem.itemsPerPacket}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      itemsPerPacket: Number(e.target.value),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget.closest("div.space-y-4")?.querySelectorAll("input")[4] as HTMLInputElement)?.focus();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Qty (total items)</Label>
                <Input
                  type="number"
                  min="1"
                  value={customItem.qty}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      qty: Number(e.target.value),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomItemToBill();
                    }
                  }}
                />
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground space-y-1">
              <p>
                Packets:{" "}
                <strong>
                  {Math.floor(
                    customItem.qty / (customItem.itemsPerPacket || 1),
                  )}
                </strong>
                {customItem.qty % (customItem.itemsPerPacket || 1) > 0 && (
                  <span>
                    {" "}
                    + {customItem.qty % (customItem.itemsPerPacket || 1)} items
                  </span>
                )}
              </p>
              <p>
                Subtotal:{" "}
                <strong>
                  PKR{" "}
                  {(
                    (customItem.pricePerItem - customItem.discountPerItem) *
                    customItem.qty
                  ).toFixed(2)}
                </strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomItem(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomItemToBill}>Add to Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
