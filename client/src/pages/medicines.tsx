import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useMedicines,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
} from "@/hooks/use-medicines";
import { useCategories } from "@/hooks/use-categories";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Barcode,
  Grid,
  List,
  X,
  Upload,
  FileText,
  Printer,
  Database,
  ArrowLeft,
  CheckCircle,
  Circle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Category,
  insertMedicineSchema,
  type InsertMedicine,
  type Medicine,
  formatStock,
} from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BarcodeComponent from "react-barcode";
import html2pdf from "html2pdf.js";

type ViewMode = "list" | "card";

export default function Medicines() {
  const { data: medicines, isLoading } = useMedicines();
  const { data: categories } = useCategories();
  const deleteMedicine = useDeleteMedicine();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<Set<string>>(
    new Set(),
  );
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showActivateView, setShowActivateView] = useState(false);

  const filteredMedicines = medicines?.filter(
    (p: Medicine) =>
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search),
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      await deleteMedicine.mutateAsync(id);
      toast({ title: "Medicine deleted" });
    }
  };

  const getCategoryName = (id: string) =>
    categories?.find((c) => c.id === id)?.name || "Uncategorized";

  const getStockStatus = (medicine: Medicine) => {
    const ipp = medicine.itemsPerPacket || 1;
    const totalItems = medicine.totalItemsInStock || medicine.stock * ipp;
    const packets = Math.floor(totalItems / ipp);
    const isLowStock = packets <= (medicine.lowStockThreshold || 10);
    return {
      isLowStock,
      color: isLowStock
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700",
      label: isLowStock ? "Low Stock" : "In Stock",
      stockDisplay: formatStock(totalItems, ipp),
    };
  };

  const toggleMedicineSelection = (medicineId: string) => {
    const newSelected = new Set(selectedMedicines);
    if (newSelected.has(medicineId)) {
      newSelected.delete(medicineId);
    } else {
      newSelected.add(medicineId);
    }
    setSelectedMedicines(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedMedicines.size === filteredMedicines?.length) {
      setSelectedMedicines(new Set());
    } else {
      setSelectedMedicines(
        new Set(filteredMedicines?.map((p: Medicine) => p.id) || []),
      );
    }
  };

  const generateBarcodePDF = () => {
    if (selectedMedicines.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one medicine",
        variant: "destructive",
      });
      return;
    }
    setShowBarcodeModal(true);
  };

  const handlePrintBarcodes = () => {
    const element = document.getElementById("barcode-print-area");
    if (!element) return;

    const options = {
      margin: 10,
      filename: "medicine-barcodes.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        orientation: "portrait" as const,
        unit: "mm" as const,
        format: "a4" as const,
      },
    };

    html2pdf().set(options).from(element).save();
  };

  if (showActivateView) {
    return (
      <Layout>
        <ActivateMedicinesView
          categories={categories || []}
          onBack={() => setShowActivateView(false)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold">Inventory</h2>
            <p className="text-muted-foreground">
              Manage your medicines and stock levels.
            </p>
          </div>
          <div className="flex gap-2">
            {selectedMedicines.size > 0 && (
              <Button
                onClick={generateBarcodePDF}
                className="gap-2"
                data-testid="button-generate-barcode-pdf"
              >
                <FileText className="w-4 h-4" /> Generate Barcodes PDF (
                {selectedMedicines.size})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowActivateView(true)}
              className="gap-2"
              data-testid="button-activate-medicines"
            >
              <Database className="w-4 h-4" /> Activate Medicines
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="gap-2"
              data-testid="button-add-medicine"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or barcode..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-medicines"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
              title="List View"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("card")}
              data-testid="button-view-card"
              title="Card View"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedMedicines.size === filteredMedicines?.length &&
                        filteredMedicines?.length !== 0
                      }
                      onCheckedChange={toggleAllSelection}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines?.map((medicine: Medicine) => {
                  const status = getStockStatus(medicine);
                  return (
                    <TableRow
                      key={medicine.id}
                      data-testid={`row-medicine-${medicine.id}`}
                      onClick={() => toggleMedicineSelection(medicine.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedMedicines.has(medicine.id)}
                          onCheckedChange={() =>
                            toggleMedicineSelection(medicine.id)
                          }
                          data-testid={`checkbox-medicine-${medicine.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {medicine.name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {medicine.barcode || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {medicine.sku || "-"}
                      </TableCell>

                      {medicine.categoryId ? (
                        <TableCell>
                          {getCategoryName(medicine.categoryId)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-sm text-muted-foreground">
                          -
                        </TableCell>
                      )}

                      <TableCell className="text-right font-bold">
                        {medicine.price.toFixed(0) || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.stockDisplay || "-"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMedicine(medicine);
                            }}
                            data-testid={`button-edit-medicine-${medicine.id}`}
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(medicine.id);
                            }}
                            data-testid={`button-delete-medicine-${medicine.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMedicines?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No medicines found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredMedicines?.map((medicine: Medicine) => {
              const status = getStockStatus(medicine);
              return (
                <Card
                  key={medicine.id}
                  className={`overflow-hidden hover-elevate cursor-pointer ${selectedMedicines.has(medicine.id) ? "ring-2 ring-primary bg-accent/5" : ""}`}
                  data-testid={`card-medicine-${medicine.id}`}
                  onClick={() => toggleMedicineSelection(medicine.id)}
                >
                  <CardHeader className="pb-2 pt-2 px-2">
                    <div className="flex justify-between items-start gap-1">
                      <Checkbox
                        checked={selectedMedicines.has(medicine.id)}
                        onCheckedChange={() => {
                          toggleMedicineSelection(medicine.id);
                        }}
                        className="mt-0.5"
                        data-testid={`checkbox-card-medicine-${medicine.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs line-clamp-2">
                          {medicine.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {medicine.categoryId
                            ? getCategoryName(medicine.categoryId)
                            : "No Category"}
                        </p>
                      </div>
                      <Badge
                        variant={status.isLowStock ? "destructive" : "default"}
                        className="text-xs h-5"
                      >
                        {status.isLowStock ? "Low" : "OK"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-2">
                    <div className="bg-muted rounded overflow-hidden flex items-center justify-center w-24 h-24 mx-auto">
                      {medicine.image ? (
                        <img
                          src={medicine.image}
                          alt={medicine.name}
                          className="w-24 h-24 object-cover"
                          data-testid={`img-medicine-${medicine.id}`}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-xs text-muted-foreground">
                            Barcode
                          </p>
                          <p className="font-mono text-xs font-semibold">
                            {medicine.barcode}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 text-xs justify-items-center">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-semibold">
                          {medicine.price.toFixed(0) || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p
                          className={`font-semibold ${status.isLowStock ? "text-red-600" : "text-green-600"}`}
                        >
                          {status.stockDisplay || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMedicine(medicine);
                        }}
                        data-testid={`button-edit-card-${medicine.id}`}
                      >
                        <Pencil className="w-2 h-2 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs px-1 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(medicine.id);
                        }}
                        data-testid={`button-delete-card-${medicine.id}`}
                      >
                        <Trash2 className="w-2 h-2 mr-1" /> Del
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredMedicines?.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No medicines found.
              </div>
            )}
          </div>
        )}
      </div>

      <MedicineForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        categories={categories || []}
      />

      {editingMedicine && (
        <MedicineForm
          open={!!editingMedicine}
          onOpenChange={(open) => !open && setEditingMedicine(null)}
          initialData={editingMedicine}
          categories={categories || []}
        />
      )}

      {/* Barcode Display Modal */}
      <Dialog open={showBarcodeModal} onOpenChange={setShowBarcodeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medicine Barcodes - Print to PDF</DialogTitle>
          </DialogHeader>
          <div
            id="barcode-print-area"
            style={{
              fontFamily: "Arial, sans-serif",
              padding: "20px",
              background: "white",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
              }}
            >
              {(
                filteredMedicines?.filter((p: Medicine) =>
                  selectedMedicines.has(p.id),
                ) || []
              ).map((medicine: Medicine) => (
                <div
                  key={medicine.id}
                  style={{
                    border: "1px solid #ccc",
                    padding: "20px",
                    textAlign: "center",
                    pageBreakInside: "avoid",
                    background: "white",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                      fontWeight: "bold",
                    }}
                  >
                    {medicine.name}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      margin: "0 0 12px 0",
                    }}
                  >
                    SKU: {medicine.sku || "N/A"}
                  </p>
                  <div
                    style={{
                      margin: "0 auto 12px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <BarcodeComponent
                      value={medicine.barcode}
                      format="CODE128"
                      width={2}
                      height={60}
                      displayValue={false}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontFamily: "monospace",
                      margin: "0",
                      fontWeight: "bold",
                    }}
                  >
                    {medicine.barcode}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBarcodeModal(false)}
              data-testid="button-close-barcode-modal"
            >
              Close
            </Button>
            <Button
              onClick={handlePrintBarcodes}
              className="gap-2"
              data-testid="button-print-barcodes"
            >
              <Printer className="w-4 h-4" /> Print to PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function MedicineForm({
  open,
  onOpenChange,
  initialData,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Medicine;
  categories: any[];
}) {
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null,
  );
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const form = useForm<InsertMedicine>({
    resolver: zodResolver(insertMedicineSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          barcode: initialData.barcode || "",

          price: initialData.price,
          actualPrice: initialData.actualPrice,
          stock: initialData.stock,
          categoryId: initialData.categoryId || "",
          lowStockThreshold: initialData.lowStockThreshold || 10,
          sku: initialData.sku || "",
          itemsPerPacket: initialData.itemsPerPacket || 1,

          supplierName: initialData.supplierName || "",
          supplierPhone: initialData.supplierPhone || "",
          supplierAddress: initialData.supplierAddress || "",
          image: initialData.image || "",
          expiryDate: initialData.expiryDate || "",
        }
      : {
          name: "",
          description: "",

          barcode: "",
          price: 0,
          actualPrice: 0,
          stock: 0,
          categoryId: "",
          lowStockThreshold: 10,
          sku: "",

          itemsPerPacket: 1,

          supplierName: "",
          supplierPhone: "",
          supplierAddress: "",
          image: "",
          expiryDate: "",
        },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setTempImage(base64String);
      setShowCropper(true);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const cropperCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropperContainerRef = useRef<HTMLDivElement>(null);
  const [cropBox, setCropBox] = useState({ x: 40, y: 40, size: 200 });
  const [resizingEdge, setResizingEdge] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const drawFullImageCropper = () => {
    const canvas = cropperCanvasRef.current;
    if (!canvas || !tempImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Calculate dimensions to fit image in 500x500 canvas maintaining aspect ratio
      const maxSize = 500;
      let displayWidth = img.width;
      let displayHeight = img.height;
      let startX = 0;
      let startY = 0;

      if (displayWidth > displayHeight) {
        displayHeight = (img.height * maxSize) / img.width;
        startY = (maxSize - displayHeight) / 2;
        displayWidth = maxSize;
      } else {
        displayWidth = (img.width * maxSize) / img.height;
        startX = (maxSize - displayWidth) / 2;
        displayHeight = maxSize;
      }

      canvas.width = maxSize;
      canvas.height = maxSize;
      setImgDimensions({ width: displayWidth, height: displayHeight });

      // Fill background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, maxSize, maxSize);

      // Draw image centered
      ctx.drawImage(img, startX, startY, displayWidth, displayHeight);

      // Draw crop box with overlay
      const { x, y, size } = cropBox;

      // Semi-transparent overlay outside crop area
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, x, maxSize);
      ctx.fillRect(x + size, 0, maxSize - (x + size), maxSize);
      ctx.fillRect(x, 0, size, y);
      ctx.fillRect(x, y + size, size, maxSize - (y + size));

      // Draw crop frame border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      const step = size / 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + step * i, y);
        ctx.lineTo(x + step * i, y + size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + step * i);
        ctx.lineTo(x + size, y + step * i);
        ctx.stroke();
      }

      // Draw resize handles
      const handleSize = 10;
      const handles = [
        { x: x - handleSize / 2, y: y - handleSize / 2 }, // top-left
        { x: x + size - handleSize / 2, y: y - handleSize / 2 }, // top-right
        { x: x - handleSize / 2, y: y + size - handleSize / 2 }, // bottom-left
        { x: x + size - handleSize / 2, y: y + size - handleSize / 2 }, // bottom-right
      ];

      ctx.fillStyle = "#ffffff";
      handles.forEach((h) => {
        ctx.fillRect(h.x, h.y, handleSize, handleSize);
      });
    };
    img.src = tempImage!;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = cropperCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = canvas.width / rect.width;
    const canvasX = x * scale;
    const canvasY = y * scale;

    const { x: cropX, y: cropY, size } = cropBox;
    const handleSize = 15;

    // Check if clicking on handles
    const edges = [
      {
        name: "tl",
        minX: cropX - handleSize,
        maxX: cropX + handleSize,
        minY: cropY - handleSize,
        maxY: cropY + handleSize,
      },
      {
        name: "tr",
        minX: cropX + size - handleSize,
        maxX: cropX + size + handleSize,
        minY: cropY - handleSize,
        maxY: cropY + handleSize,
      },
      {
        name: "bl",
        minX: cropX - handleSize,
        maxX: cropX + handleSize,
        minY: cropY + size - handleSize,
        maxY: cropY + size + handleSize,
      },
      {
        name: "br",
        minX: cropX + size - handleSize,
        maxX: cropX + size + handleSize,
        minY: cropY + size - handleSize,
        maxY: cropY + size + handleSize,
      },
    ];

    for (const edge of edges) {
      if (
        canvasX >= edge.minX &&
        canvasX <= edge.maxX &&
        canvasY >= edge.minY &&
        canvasY <= edge.maxY
      ) {
        setResizingEdge(edge.name);
        setDragStart({ x: canvasX, y: canvasY });
        return;
      }
    }

    // Check if clicking inside crop box to drag
    if (
      canvasX >= cropX &&
      canvasX <= cropX + size &&
      canvasY >= cropY &&
      canvasY <= cropY + size
    ) {
      setResizingEdge("move");
      setDragStart({ x: canvasX, y: canvasY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!resizingEdge) return;

    const canvas = cropperCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = canvas.width / rect.width;
    const canvasX = x * scale;
    const canvasY = y * scale;

    const deltaX = canvasX - dragStart.x;
    const deltaY = canvasY - dragStart.y;

    const { x: cropX, y: cropY, size } = cropBox;
    const maxSize = 500;
    const minCropSize = 50;

    if (resizingEdge === "move") {
      const newX = Math.max(0, Math.min(cropX + deltaX, maxSize - size));
      const newY = Math.max(0, Math.min(cropY + deltaY, maxSize - size));
      setCropBox({ ...cropBox, x: newX, y: newY });
    } else if (resizingEdge === "tl") {
      const newX = Math.max(0, cropX + deltaX);
      const newY = Math.max(0, cropY + deltaY);
      const newSize = Math.max(minCropSize, size - deltaX, size - deltaY);
      setCropBox({ x: newX, y: newY, size: newSize });
    } else if (resizingEdge === "tr") {
      const newY = Math.max(0, cropY + deltaY);
      const newSize = Math.max(minCropSize, size + deltaX, size - deltaY);
      setCropBox({ x: cropX, y: newY, size: newSize });
    } else if (resizingEdge === "bl") {
      const newX = Math.max(0, cropX + deltaX);
      const newSize = Math.max(minCropSize, size - deltaX, size + deltaY);
      setCropBox({ x: newX, y: cropY, size: newSize });
    } else if (resizingEdge === "br") {
      const newSize = Math.max(minCropSize, size + deltaX, size + deltaY);
      setCropBox({ x: cropX, y: cropY, size: newSize });
    }

    setDragStart({ x: canvasX, y: canvasY });
    drawFullImageCropper();
  };

  const handleCanvasMouseUp = () => {
    setResizingEdge(null);
  };

  const handleResetCropper = () => {
    setCropBox({ x: 40, y: 40, size: 200 });
    drawFullImageCropper();
  };

  useEffect(() => {
    if (showCropper && tempImage) {
      setTimeout(() => drawFullImageCropper(), 0);
    }
  }, [showCropper, tempImage]);

  const handleCropImage = () => {
    if (!tempImage || !canvasRef.current) {
      console.log("Missing tempImage or canvasRef");
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.log("Failed to get canvas context");
          return;
        }

        const { x, y, size } = cropBox;
        const maxSize = 500;

        // Calculate how the image is positioned on the 500x500 canvas
        let displayWidth = img.width;
        let displayHeight = img.height;
        let startX = 0;
        let startY = 0;

        if (displayWidth > displayHeight) {
          displayHeight = (img.height * maxSize) / img.width;
          startY = (maxSize - displayHeight) / 2;
          displayWidth = maxSize;
        } else {
          displayWidth = (img.width * maxSize) / img.height;
          startX = (maxSize - displayWidth) / 2;
          displayHeight = maxSize;
        }

        // Map the crop box (in canvas space) back to original image space
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;

        const sourceX = Math.max(0, (x - startX) * scaleX);
        const sourceY = Math.max(0, (y - startY) * scaleY);
        const sourceSize = size * Math.min(scaleX, scaleY);

        // Create the 400x400 cropped output
        canvas.width = 400;
        canvas.height = 400;
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          400,
          400,
        );

        const croppedImage = canvas.toDataURL("image/jpeg", 0.9);
        console.log("Crop successful, setting image");
        setImagePreview(croppedImage);
        form.setValue("image", croppedImage);
        setShowCropper(false);
        setTempImage(null);
        setCropBox({ x: 40, y: 40, size: 200 });
        toast({ title: "Image cropped successfully" });
      } catch (error) {
        console.error("Error cropping image:", error);
        toast({
          title: "Error",
          description: "Failed to crop image",
          variant: "destructive",
        });
      }
    };
    img.onerror = () => {
      console.error("Failed to load image for cropping");
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
    };
    img.src = tempImage;
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: InsertMedicine) => {
    try {
      if (initialData) {
        await updateMedicine.mutateAsync({ id: initialData.id, ...data });
        toast({ title: "Medicine updated successfully" });
      } else {
        await createMedicine.mutateAsync(data);
        toast({ title: "Medicine created successfully" });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save medicine. Check required fields.",
        variant: "destructive",
      });
    }
  };

  const generateBarcode = () => {
    const random = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0");
    form.setValue("barcode", random);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-medicine-form">
              {initialData ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Basic Information
              </h4>

              <div className="grid gap-2">
                <Label htmlFor="name">
                  Medicine Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter medicine name"
                  {...form.register("name")}
                  data-testid="input-medicine-name"
                />
                {form.formState.errors.name && (
                  <span className="text-red-500 text-xs">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(val) => form.setValue("categoryId", val)}
                  defaultValue={form.getValues("categoryId") || ""}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional medicine description"
                  {...form.register("description")}
                  data-testid="textarea-medicine-description"
                />
              </div>
            </div>

            {/* Identification */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Identification
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      placeholder="Scan or enter barcode"
                      {...form.register("barcode")}
                      data-testid="input-medicine-barcode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateBarcode}
                      title="Generate random barcode"
                    >
                      <Barcode className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.formState.errors.barcode && (
                    <span className="text-red-500 text-xs">
                      {form.formState.errors.barcode.message}
                    </span>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="Stock Keeping Unit"
                    {...form.register("sku")}
                    data-testid="input-medicine-sku"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...form.register("expiryDate")}
                  data-testid="input-medicine-expiry-date"
                />
              </div>
            </div>

            {/* Packaging & Pricing */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Packaging & Pricing
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="itemsPerPacket">
                    Items Per Packet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="itemsPerPacket"
                    type="number"
                    min="1"
                    {...form.register("itemsPerPacket", {
                      valueAsNumber: true,
                    })}
                    data-testid="input-items-per-packet"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actualPrice">
                    Purchase Price (PKR){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="actualPrice"
                    type="number"
                    {...form.register("actualPrice", { valueAsNumber: true })}
                    data-testid="input-medicine-actual-price"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">
                    Retail Price (PKR){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    {...form.register("price", { valueAsNumber: true })}
                    data-testid="input-medicine-price"
                  />
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Stock
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">
                    Stock (Packets) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    {...form.register("stock", { valueAsNumber: true })}
                    data-testid="input-medicine-stock"
                  />
                  {form.formState.errors.stock && (
                    <span className="text-red-500 text-xs">
                      {form.formState.errors.stock.message}
                    </span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lowStockThreshold">
                    Low Stock Threshold (Packets)
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    {...form.register("lowStockThreshold", {
                      valueAsNumber: true,
                    })}
                    data-testid="input-medicine-threshold"
                  />
                </div>
              </div>
            </div>

            {/* Medicine Image */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Medicine Image (Optional)
              </h4>

              <div className="grid gap-2">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="w-32 h-32 mx-auto rounded overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Medicine preview"
                          className="w-full h-full object-cover"
                          data-testid="img-preview-medicine"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Cropped Square Image
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1"
                          data-testid="button-change-image"
                        >
                          Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="flex-1"
                          data-testid="button-remove-image"
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Click to upload & crop medicine image
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        data-testid="input-file-image"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-3 h-3 mr-1" /> Choose Image
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 5MB. Supports JPG, PNG, GIF, WebP. Will be cropped to
                  square.
                </p>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Supplier Information
              </h4>

              <div className="grid gap-2">
                <Label htmlFor="supplier-name">Supplier Name</Label>
                <Input
                  id="supplier-name"
                  placeholder="e.g., Fresh Farms Ltd"
                  {...form.register("supplierName")}
                  data-testid="input-supplier-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplier-phone">Supplier Phone</Label>
                  <Input
                    id="supplier-phone"
                    placeholder="e.g., 0300-1234567"
                    {...form.register("supplierPhone")}
                    data-testid="input-supplier-phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier-address">Supplier Address</Label>
                  <Input
                    id="supplier-address"
                    placeholder="e.g., 123 Farm Road"
                    {...form.register("supplierAddress")}
                    data-testid="input-supplier-address"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
                data-testid="button-cancel-form"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMedicine.isPending || updateMedicine.isPending}
                data-testid="button-submit-form"
              >
                Save Medicine
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog - Simple */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="sm:max-w-xl p-4">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          {tempImage && (
            <div ref={cropperContainerRef} className="space-y-3">
              {/* Canvas */}
              <canvas
                ref={cropperCanvasRef}
                width={500}
                height={500}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="w-full border border-primary rounded cursor-grab active:cursor-grabbing"
                style={{ backgroundColor: "#000" }}
                data-testid="canvas-image-cropper"
              />

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetCropper}
                  data-testid="button-reset-crop"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCropper(false);
                    setTempImage(null);
                    setCropBox({ x: 40, y: 40, size: 200 });
                  }}
                  data-testid="button-cancel-crop"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCropImage}
                  data-testid="button-confirm-crop"
                >
                  Crop & Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for cropping output */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}

// ---- Activate Medicines View ----

interface ActivateMedicinesViewProps {
  categories: any[];
  onBack: () => void;
}

function ActivateMedicinesView({
  categories,
  onBack,
}: ActivateMedicinesViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activatingEntry, setActivatingEntry] = useState<any | null>(null);

  // Form state for the activation modal
  const [modalForm, setModalForm] = useState({
    itemsPerPacket: 1,
    stock: 0,
    actualPrice: 0,
    price: 0,
    expiryDate: "",
    categoryId: "",
    barcode: "",
    sku: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    lowStockThreshold: 10,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: dbMedicines = [], isLoading } = useQuery({
    queryKey: ["/api/medicines-db", debouncedSearch],
    queryFn: async () => {
      const url = debouncedSearch
        ? `/api/medicines-db?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/medicines-db";
      const res = await fetch(url);
      return res.json();
    },
  });

  const activateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/medicines-db/${id}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Activation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Medicine activated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines-db"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      setActivatingEntry(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/medicines-db/${id}/deactivate`, { method: "PATCH" });
    },
    onSuccess: () => {
      toast({ title: "Medicine deactivated" });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines-db"] });
    },
  });

  const handleActivate = (entry: any) => {
    setActivatingEntry(entry);
    setModalForm({
      itemsPerPacket: 1,
      stock: 0,
      actualPrice: 0,
      price: 0,
      expiryDate: "",
      categoryId: "",
      barcode: "",
      sku: "",
      supplierName: "",
      supplierPhone: "",
      supplierAddress: "",
      lowStockThreshold: 10,
    });
  };

  const handleConfirmActivate = () => {
    if (!activatingEntry) return;
    if (!modalForm.price || modalForm.price <= 0) {
      toast({ title: "Retail price is required", variant: "destructive" });
      return;
    }
    activateMutation.mutate({
      id: activatingEntry.id,
      data: {
        name: activatingEntry.name,
        description:
          activatingEntry.description || activatingEntry.genericName || "",
        ...modalForm,
      },
    });
  };

  const generateBarcode = () => {
    const random = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0");
    setModalForm((p) => ({ ...p, barcode: random }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-display font-bold">
            Activate Medicines
          </h2>
          <p className="text-muted-foreground">
            Search the pharmaceutical directory and add medicines to your
            inventory.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, generic name, category..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  Loading medicines directory...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && dbMedicines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No medicines found.
                </TableCell>
              </TableRow>
            )}
            {dbMedicines.map((entry: any) => (
              <TableRow key={entry.id} className="hover:bg-muted/40">
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.genericName || "-"}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                    {entry.category || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{entry.type || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.manufacturer || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {entry.isActivated ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 text-red-500 border-red-200"
                        onClick={() => deactivateMutation.mutate(entry.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        Deactivate
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleActivate(entry)}
                    >
                      <Circle className="w-3.5 h-3.5 mr-1" /> Activate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Activation Modal */}
      <Dialog
        open={!!activatingEntry}
        onOpenChange={(open) => !open && setActivatingEntry(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activate: {activatingEntry?.name}</DialogTitle>
            {activatingEntry?.genericName && (
              <p className="text-sm text-muted-foreground">
                {activatingEntry.genericName} — {activatingEntry.manufacturer}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Packaging & Pricing */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Packaging & Pricing
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label>
                    Items Per Packet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={modalForm.itemsPerPacket}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        itemsPerPacket: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label>
                    Purchase Price (PKR){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={modalForm.actualPrice}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        actualPrice: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label>
                    Retail Price (PKR){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={modalForm.price}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Stock
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>
                    Initial Stock (Packets){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={modalForm.stock}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        stock: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    value={modalForm.lowStockThreshold}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        lowStockThreshold: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Identification
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scan or enter barcode"
                      value={modalForm.barcode}
                      onChange={(e) =>
                        setModalForm((p) => ({ ...p, barcode: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateBarcode}
                    >
                      <Barcode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label>SKU</Label>
                  <Input
                    placeholder="Stock Keeping Unit"
                    value={modalForm.sku}
                    onChange={(e) =>
                      setModalForm((p) => ({ ...p, sku: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={modalForm.expiryDate}
                  onChange={(e) =>
                    setModalForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Category & Supplier */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-1">
                Category & Supplier
              </h4>
              <div className="grid gap-1">
                <Label>Category</Label>
                <Select
                  value={modalForm.categoryId}
                  onValueChange={(val) =>
                    setModalForm((p) => ({ ...p, categoryId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Supplier Name</Label>
                <Input
                  placeholder={
                    activatingEntry?.manufacturer || "e.g., GSK Pakistan"
                  }
                  value={modalForm.supplierName}
                  onChange={(e) =>
                    setModalForm((p) => ({
                      ...p,
                      supplierName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Supplier Phone</Label>
                  <Input
                    placeholder="0300-0000000"
                    value={modalForm.supplierPhone}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        supplierPhone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Supplier Address</Label>
                  <Input
                    placeholder="City / Address"
                    value={modalForm.supplierAddress}
                    onChange={(e) =>
                      setModalForm((p) => ({
                        ...p,
                        supplierAddress: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivatingEntry(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending
                ? "Activating..."
                : "Confirm & Add to Inventory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
