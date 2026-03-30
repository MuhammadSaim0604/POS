import { Layout } from "@/components/layout";
import { StatsCard } from "@/components/stats-card";
import { useMedicines } from "@/hooks/use-medicines";
import { useSales } from "@/hooks/use-sales";
import { useCategories } from "@/hooks/use-categories";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Tags,
  TrendingUp,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export default function Dashboard() {
  const { data: medicines } = useMedicines();
  const { data: sales } = useSales();
  const { data: categories } = useCategories();

  // Get today's sales (completed bills)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSales =
    sales?.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    }) || [];

  const totalRevenue =
    sales?.reduce((acc: number, sale: any) => acc + sale.total, 0) || 0;
  const totalProfit =
    sales?.reduce((acc: number, sale: any) => {
      const saleProfit = sale.items.reduce((itemAcc: number, item: any) => {
        const medicine = (medicines as any[])?.find(
          (p: any) => p.id === item.medicineId || p.name === item.medicineName,
        );

        const itemsPerPacket =
          item.itemsPerPacket || medicine?.itemsPerPacket || 1;
        const actualPricePerItem = medicine?.actualPrice || 0;
        const sellingPricePerItem = item.priceAtSale || 0;

        const packetQty = item.quantity || 0;
        const totalItems = packetQty * itemsPerPacket;

        const profit = (sellingPricePerItem - actualPricePerItem) * totalItems;
        // console.log(
        //   "medicine",
        //   medicine,
        //   "item",
        //   item,
        //   "itemsPerPacket",
        //   itemsPerPacket,
        //   "actualPricePerItem",
        //   actualPricePerItem,
        //   "sellingPricePerItem",
        //   sellingPricePerItem,
        //   "packetQty",
        //   packetQty,
        //   "totalItems",
        //   totalItems,
        //   "profit",
        //   profit,
        // );

        return itemAcc + profit;
      }, 0);
      return acc + saleProfit;
    }, 0) || 0;
  const totalMedicines = medicines?.length || 0;
  const lowStockMedicines =
    (medicines as any[])?.filter((p: any) => {
      const ipp = p.itemsPerPacket || 1;
      const totalItems = p.totalItemsInStock || (p.stock * ipp);
      const packets = Math.floor(totalItems / ipp);
      return packets <= (p.lowStockThreshold || 10);
    }) || [];
  const totalCategories = categories?.length || 0;
  const lowStockCount = lowStockMedicines.length || 0;

  // Real data for chart - aggregate sales by day for the current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const daySales =
      sales?.filter((sale: any) => isSameDay(new Date(sale.date), day)) || [];
    const dailyTotal = daySales.reduce(
      (acc: number, sale: any) => acc + sale.total,
      0,
    );
    return {
      name: format(day, "EEE"),
      sales: dailyTotal,
    };
  });

  // Top medicines calculation
  const medicineSalesMap: Record<string, number> = {};
  sales?.forEach((sale: any) => {
    sale.items.forEach((item: any) => {
      // Bill items use medicineName + qty; legacy sale items use name + quantity
      const name = item.medicineName || item.name;
      const qty = item.qty || item.quantity;
      if (name) {
        medicineSalesMap[name] = (medicineSalesMap[name] || 0) + qty;
      }
    });
  });

  const topMedicines = Object.entries(medicineSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Category distribution for pie chart
  const categoryData =
    categories
      ?.map((cat) => {
        const count =
          (medicines as any[])?.filter((p: any) => p.categoryId === cat.id)
            .length || 0;
        return { name: cat.name, value: count };
      })
      .filter((c) => c.value > 0) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              Dashboard
            </h2>
            <p className="text-muted-foreground">
              Overview of your store's performance.
            </p>
          </div>
          <Link href="/bills/create">
            <Button
              size="lg"
              className="bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 text-lg px-8"
            >
              Create New Bill
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`PKR ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
            icon={DollarSign}
            trend="up"
            trendValue="12%"
            description="All time revenue"
          />
          <StatsCard
            title="Total Profit"
            value={`PKR ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
            icon={TrendingUp}
            trend="up"
            trendValue="8%"
            description="Estimated net profit"
          />
          <StatsCard
            title="Medicines in Stock"
            value={totalMedicines}
            icon={Package}
            description="active SKUs"
          />
          <StatsCard
            title="Today's Sales"
            value={todaysSales.length}
            icon={ShoppingBag}
            trend="up"
            trendValue="5%"
            description="transactions today"
          />

          <StatsCard
            title="Categories"
            value={totalCategories}
            icon={Tags}
            description="organized sections"
          />
          <StatsCard
            title="Low Stock Medicines"
            value={lowStockCount}
            icon={AlertTriangle}
            trend="down"
            trendValue="3%"
            description="Low in stock"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-md border-0">
            <CardHeader>
              <CardTitle>Weekly Sales Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `PKR ${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(sales || [])?.slice(0, 5).map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Order #{sale.billNumber || sale.id.slice(0, 6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="font-medium text-right">
                      +PKR {sale.total.toFixed(2)}
                      <p className="text-xs text-muted-foreground">
                        {sale.items.length} items
                      </p>
                    </div>
                  </div>
                ))}
                {!sales?.length && (
                  <p className="text-center text-muted-foreground py-8">
                    No sales recorded.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-3 shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-4 shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Top Selling Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMedicines.map((medicine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{medicine.name}</span>
                    <span className="text-sm font-bold text-primary">
                      {medicine.qty} packets sold
                    </span>
                  </div>
                ))}
                {topMedicines.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No sales data available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lowStockMedicines.slice(0, 6).map((medicine: any) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5 border-destructive/20"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {medicine.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {medicine.article}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-destructive">
                        {(() => {
                          const ipp = medicine.itemsPerPacket || 1;
                          const total = medicine.totalItemsInStock || (medicine.stock * ipp);
                          const pkts = Math.floor(total / ipp);
                          const rem = total % ipp;
                          return ipp === 1 ? `${total}` : rem === 0 ? `${pkts} pkts` : `${pkts} pkts ${rem} items`;
                        })()} left
                      </span>
                      <Link href={`/restock?barcode=${medicine.barcode}`}>
                        <Button size="sm" variant="outline" className="h-8">
                          Restock
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockMedicines.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  All medicines well stocked.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
