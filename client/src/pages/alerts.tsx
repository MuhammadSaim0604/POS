import { Layout } from "@/components/layout";
import { useProducts } from "@/hooks/use-products";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function LowStockAlerts() {
  const { data: products, isLoading } = useProducts();

  const lowStockProducts =
    products?.filter((p) => {
      const threshold =
        p.lowStockThreshold !== undefined && p.lowStockThreshold !== null
          ? p.lowStockThreshold
          : 5;
      return p.stock <= threshold;
    }) || [];

  return (
    <Layout>
      <div className="space-y-6 pb-10">
        <div>
          <h2 className="text-3xl font-display font-bold text-red-600">
            Low Stock Alerts
          </h2>
          <p className="text-muted-foreground">
            Products that need immediate restocking based on their individual
            thresholds.
          </p>
        </div>

        <div className="grid gap-6">
          {lowStockProducts.map((product) => (
            <Card
              key={product.id}
              className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow bg-card overflow-hidden"
            >
              <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1 w-full">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 bg-muted rounded-2xl overflow-hidden flex-shrink-0 shadow-inner border border-muted-foreground/10 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/20" />
                    )}
                    <div className="absolute top-1 right-1">
                      <div className="p-1.5 bg-red-500 text-white rounded-full shadow-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-xl md:text-2xl">
                        {product.name}
                      </h3>
                      {product.color && (
                        <Badge variant="outline" className="bg-muted/50">
                          {product.color}
                        </Badge>
                      )}
                      {product.size && (
                        <Badge variant="outline" className="bg-muted/50">
                          {product.size}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-muted rounded">
                            Barcode
                          </span>
                          <span className="font-mono">
                            {product.barcode || "N/A"}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-muted rounded">
                            Threshold
                          </span>
                          <span>{product.lowStockThreshold || 5} units</span>
                        </p>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="text-2xl font-bold text-red-600 flex items-baseline gap-2">
                          {product.stock}
                          <span className="text-sm font-medium text-muted-foreground uppercase tracking-tighter">
                            Packets Remaining
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (product.stock / (product.lowStockThreshold || 5)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <Link href={`/restock?barcode=${product.barcode}`}>
                    <Button
                      size="lg"
                      className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 font-bold gap-2 active-elevate-2"
                      data-testid={`button-restock-${product.id}`}
                    >
                      <Plus className="w-5 h-5" /> Restock Now
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full md:w-auto text-muted-foreground hover:text-foreground"
                    >
                      Edit Product
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {!isLoading && lowStockProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-3xl border border-dashed border-muted-foreground/20 animate-in fade-in zoom-in duration-500">
              <div className="bg-green-100 p-6 rounded-full mb-6 shadow-inner ring-8 ring-green-50/50">
                <ShieldCheck className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-3xl font-display font-bold text-green-700">
                Stock Levels Perfect!
              </h3>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                All products are currently above their minimum safety
                thresholds.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
