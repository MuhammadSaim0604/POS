import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ChevronDown } from "lucide-react";

export interface Variation {
  id: string;
  color: string;
  size: string;
  barcode: string;
  pricePerItem: number;
  actualPrice: number;
  itemsPerPacket: number;
  quantity: number;
  sku: string;
  image: string;
  lowStockThreshold: number;
}

interface VariationGeneratorProps {
  onVariationsGenerated: (variations: Variation[]) => void;
  productName: string;
}

const generateEAN13 = (): string => {
  const digits = Array(12)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10))
    .join("");

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return digits + checkDigit;
};

export function VariationGenerator({
  onVariationsGenerated,
  productName,
}: VariationGeneratorProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [pricePerItem, setPricePerItem] = useState(0);
  const [actualPrice, setActualPrice] = useState(0);
  const [itemsPerPacket, setItemsPerPacket] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [generatedVariations, setGeneratedVariations] = useState<Variation[]>(
    [],
  );
  const [expandedVariationId, setExpandedVariationId] = useState<string | null>(
    null,
  );
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const addSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes([...sizes, sizeInput.trim()]);
      setSizeInput("");
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter((c) => c !== color));
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
  };

  const generateVariations = () => {
    if (colors.length === 0 || sizes.length === 0) {
      alert("Please add at least one color and one size");
      return;
    }

    const variations: Variation[] = [];
    let variationId = 0;

    for (const color of colors) {
      for (const size of sizes) {
        variations.push({
          id: `var-${variationId++}`,
          color,
          size,
          barcode: generateEAN13(),
          pricePerItem,
          actualPrice,
          itemsPerPacket,
          quantity,
          sku: "",
          image: "",
          lowStockThreshold,
        });
      }
    }

    setGeneratedVariations(variations);
  };

  const updateVariation = (id: string, field: keyof Variation, value: any) => {
    setGeneratedVariations(
      generatedVariations.map((v) =>
        v.id === id ? { ...v, [field]: value } : v,
      ),
    );
  };

  const deleteVariation = (id: string) => {
    setGeneratedVariations(generatedVariations.filter((v) => v.id !== id));
  };

  const handleVariationImageChange = async (
    variationId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      updateVariation(variationId, "image", base64String);
    };
    reader.readAsDataURL(file);
  };

  const confirmVariations = () => {
    if (generatedVariations.length === 0) {
      alert("Please generate variations first");
      return;
    }
    onVariationsGenerated(generatedVariations);
  };

  return (
    <div className="space-y-6 border-t pt-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Variable Medicine Generator
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create multiple medicine variations (e.g., {productName || "Medicine"}{" "}
          in different colors and sizes)
        </p>
      </div>

      {/* Colors Section */}
      <div className="space-y-3">
        <Label className="font-semibold">Colors</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Red, Blue, Brown"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColor()}
            data-testid="input-color-name"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addColor}
            data-testid="button-add-color"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Badge
                key={color}
                variant="secondary"
                className="gap-1"
                data-testid={`badge-color-${color}`}
              >
                {color}
                <button
                  onClick={() => removeColor(color)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sizes Section */}
      <div className="space-y-3">
        <Label className="font-semibold">Sizes</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 7-11, 3-10, Small, Large"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSize()}
            data-testid="input-size-name"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addSize}
            data-testid="button-add-size"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Badge
                key={size}
                variant="secondary"
                className="gap-1"
                data-testid={`badge-size-${size}`}
              >
                {size}
                <button
                  onClick={() => removeSize(size)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Common Settings */}
      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="var-actual-price">Purchase Price (PKR) *</Label>
          <Input
            id="var-actual-price"
            type="number"
            step="5"
            value={actualPrice}
            onChange={(e) => setActualPrice(parseFloat(e.target.value) || 0)}
            data-testid="input-var-price"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="var-price">Retail Price (PKR) *</Label>
          <Input
            id="var-price"
            type="number"
            step="5"
            value={pricePerItem}
            onChange={(e) => setPricePerItem(parseFloat(e.target.value) || 0)}
            data-testid="input-var-price"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="var-items">Items Per Packet *</Label>
          <Input
            id="var-items"
            type="number"
            min="1"
            value={itemsPerPacket}
            onChange={(e) => setItemsPerPacket(parseInt(e.target.value) || 1)}
            data-testid="input-var-items"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="var-quantity">Stock Quantity *</Label>
          <Input
            id="var-quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            data-testid="input-var-quantity"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="var-threshold">Low Stock Threshold</Label>
          <Input
            id="var-threshold"
            type="number"
            min="0"
            value={lowStockThreshold}
            onChange={(e) =>
              setLowStockThreshold(parseInt(e.target.value) || 10)
            }
            data-testid="input-var-threshold"
          />
        </div>
      </div>

      {/* Generate Button */}
      <Button
        type="button"
        onClick={generateVariations}
        className="w-full"
        data-testid="button-generate-variations"
      >
        Generate Variations ({colors.length} colors × {sizes.length} sizes ={" "}
        {colors.length * sizes.length})
      </Button>

      {/* Variations Preview with Inline Editing */}
      {generatedVariations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">
            Generated Variations ({generatedVariations.length})
          </h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">
                    Purchase Price/Item
                  </TableHead>
                  <TableHead className="text-right">Price/Item</TableHead>
                  <TableHead className="text-right">Items/Packet</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedVariations.map((variation) => (
                  <>
                    <TableRow
                      key={variation.id}
                      data-testid={`row-variation-${variation.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpandedVariationId(
                          expandedVariationId === variation.id
                            ? null
                            : variation.id,
                        )
                      }
                    >
                      <TableCell>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedVariationId === variation.id
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </TableCell>
                      <TableCell>{variation.color}</TableCell>
                      <TableCell>{variation.size}</TableCell>
                      <TableCell className="text-center">
                        PKR {variation.actualPrice}
                      </TableCell>
                      <TableCell className="text-center">
                        PKR {variation.pricePerItem}
                      </TableCell>
                      <TableCell className="text-right">
                        {variation.itemsPerPacket}
                      </TableCell>
                      <TableCell className="text-right">
                        {variation.quantity}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVariation(variation.id);
                          }}
                          className="text-destructive hover:text-destructive/80"
                          data-testid={`button-delete-variation-${variation.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedVariationId === variation.id && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`color-${variation.id}`}>
                                  Color
                                </Label>
                                <Input
                                  id={`color-${variation.id}`}
                                  value={variation.color}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "color",
                                      e.target.value,
                                    )
                                  }
                                  data-testid={`input-variation-color-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`size-${variation.id}`}>
                                  Size
                                </Label>
                                <Input
                                  id={`size-${variation.id}`}
                                  value={variation.size}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "size",
                                      e.target.value,
                                    )
                                  }
                                  data-testid={`input-variation-size-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`barcode-${variation.id}`}>
                                  Barcode
                                </Label>
                                <Input
                                  id={`barcode-${variation.id}`}
                                  value={variation.barcode}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "barcode",
                                      e.target.value,
                                    )
                                  }
                                  data-testid={`input-variation-barcode-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`sku-${variation.id}`}>
                                  SKU
                                </Label>
                                <Input
                                  id={`sku-${variation.id}`}
                                  value={variation.sku}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "sku",
                                      e.target.value,
                                    )
                                  }
                                  data-testid={`input-variation-sku-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`actualPrice-${variation.id}`}>
                                  Purchase Price (PKR)
                                </Label>
                                <Input
                                  id={`actualPrice-${variation.id}`}
                                  type="number"
                                  step="5"
                                  value={variation.actualPrice}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "actualPrice",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  data-testid={`input-variation-actualPrice-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`price-${variation.id}`}>
                                  Retail Price (PKR)
                                </Label>
                                <Input
                                  id={`price-${variation.id}`}
                                  type="number"
                                  step="5"
                                  value={variation.pricePerItem}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "pricePerItem",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  data-testid={`input-variation-price-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`items-${variation.id}`}>
                                  Items Per Packet
                                </Label>
                                <Input
                                  id={`items-${variation.id}`}
                                  type="number"
                                  min="1"
                                  value={variation.itemsPerPacket}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "itemsPerPacket",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  data-testid={`input-variation-items-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`stock-${variation.id}`}>
                                  Stock Quantity
                                </Label>
                                <Input
                                  id={`stock-${variation.id}`}
                                  type="number"
                                  min="0"
                                  value={variation.quantity}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "quantity",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  data-testid={`input-variation-stock-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`threshold-${variation.id}`}>
                                  Low Stock Threshold
                                </Label>
                                <Input
                                  id={`threshold-${variation.id}`}
                                  type="number"
                                  min="0"
                                  value={variation.lowStockThreshold}
                                  onChange={(e) =>
                                    updateVariation(
                                      variation.id,
                                      "lowStockThreshold",
                                      parseInt(e.target.value) || 10,
                                    )
                                  }
                                  data-testid={`input-variation-threshold-${variation.id}`}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Variation Image (Optional)</Label>
                                {variation.image ? (
                                  <div className="space-y-2">
                                    <div className="relative inline-block">
                                      <img
                                        src={variation.image}
                                        alt="Variation preview"
                                        className="w-20 h-20 object-cover rounded"
                                        data-testid={`img-variation-preview-${variation.id}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateVariation(
                                            variation.id,
                                            "image",
                                            "",
                                          );
                                        }}
                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/80"
                                        title="Remove image"
                                        data-testid={`button-remove-variation-image-${variation.id}`}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        fileInputRefs.current[
                                          variation.id
                                        ]?.click();
                                      }}
                                      data-testid={`button-change-variation-image-${variation.id}`}
                                    >
                                      Change
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      fileInputRefs.current[
                                        variation.id
                                      ]?.click();
                                    }}
                                    data-testid={`button-upload-variation-image-${variation.id}`}
                                  >
                                    Upload Image
                                  </Button>
                                )}
                                <input
                                  ref={(el) => {
                                    if (el)
                                      fileInputRefs.current[variation.id] = el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleVariationImageChange(variation.id, e)
                                  }
                                  className="hidden"
                                  data-testid={`input-variation-image-${variation.id}`}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            type="button"
            onClick={confirmVariations}
            className="w-full"
            data-testid="button-confirm-variations"
          >
            Use These Variations
          </Button>
        </div>
      )}
    </div>
  );
}
