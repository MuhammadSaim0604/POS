
import { format } from "date-fns";
import type { Bill, BillItem, Category, Product } from "@shared/schema";
import { Package } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

interface BillTemplateProps {
  bill: Bill;
  categories: Category[];
  products?: Product[];
}

export function BillTemplate({
  bill,
  categories,
  products,
}: BillTemplateProps) {
  const { settings } = useSettings();
  // Group items by "Article" (actual article field or product name) and "Size"
  // Each group will show colors in columns
  const groupedItems: Record<
    string,
    Record<string, Record<string, BillItem>>
  > = {};
  const allColors = new Set<string>();

  bill.items.forEach((item) => {
    const articleName = item.article || item.productName;
    const size = item.size || "N/A";
    const color = item.color || "Default";

    if (!groupedItems[articleName]) groupedItems[articleName] = {};
    if (!groupedItems[articleName][size]) groupedItems[articleName][size] = {};

    groupedItems[articleName][size][color] = item;
    allColors.add(color);
  });

  // Dynamic colors list from the bill items
  const colorsList = Array.from(allColors);
  // Ensure we have at least some columns if empty (though usually not the case)
  if (colorsList.length === 0) colorsList.push("Default");

  return (
    <div
      className="bg-white p-8 text-black font-sans max-w-[800px] mx-auto border"
      id="bill-print-template"
    >
      {/* Header - Logo Left, Info Center */}
      <div className="relative w-full mb-2 pt-2 flex items-center justify-center gap-4">
        <div className="">
          <img
            src="/ChatGPT_Image_Jan_1,_2026,_03_19_22_PM_1767262811190.png"
            alt="FB Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-wide leading-none mb-1">
            COLLECTION
          </h1>
          <div className="flex flex-col items-center">
            <p className="text-[10px]">
              {settings?.storeAddress ||
                "FB Collection, near Kabeer Brothers, Karor Pakka"}
            </p>
            <p className="text-[10px]">
              Ph # {settings?.storePhone || "0301-7766395"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {/* Row 1: Invoice Title and Invoice Box */}
        <div className="flex justify-between items-center relative">
          <h2 className="text-2xl font-bold border-black whitespace-nowrap">
            Credit Sale Invoice
          </h2>
          <div className="border-2 border-black p-2 rounded-xl text-[11px] whitespace-nowrap min-w-[120px] absolute right-0 -bottom-8">
            <div className="pb-1 mb-1 flex justify-between gap-12">
              <span className="font-bold">Invoice No:</span>
              <span>{bill.billNumber}</span>
            </div>
            <div className="flex justify-between gap-12">
              <span className="font-bold">Invoice Date:</span>
              <span>{format(new Date(bill.date), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Customer Details */}
        <div className="flex justify-between items-start gap-8">
          <div className="flex-1 space-y-1">
            <p className="font-bold text-lg underline mb-2">
              {bill.customerBusinessName || bill.customerName}
            </p>
            <div className="grid grid-cols-[100px_1fr] text-[11px]">
              <span className="font-bold">Customer Name:-</span>
              <span>{bill.customerName || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] text-[11px]">
              <span className="font-bold">City Name:-</span>
              <span>{bill.customerCity || "N/A"}</span>
            </div>

            <div className="grid grid-cols-[100px_1fr] text-[11px]">
              <span className="font-bold">Remarks :-</span>
              <span>
                {bill.remarks || `Bilty No # ${bill.biltyNo || "N/A"}`}
              </span>
            </div>
          </div>
          <div className="text-right space-y-2 pt-12">
            <div className="grid grid-cols-[1fr_150px] text-[11px] whitespace-nowrap">
              <span className="font-bold mr-2">Address :-</span>
              <span>{bill.customerAddress || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[1fr_150px] text-[11px] whitespace-nowrap">
              <span className="font-bold mr-2">Mobile :-</span>
              <span>{bill.customerPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse  text-[10px]">
        <thead>
          <tr className="bg-gray-100 font-bold">
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold">
              Sr No
            </th>
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold">
              Article
            </th>
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold">
              Group
            </th>
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold w-12">
              Size
            </th>
            {colorsList.map((color, idx) => (
              <th
                key={idx}
                className="border border-black px-1 h-10 align-center pb-1 text-center font-bold w-12"
              >
                {color}
              </th>
            ))}
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold w-12">
              Qty
            </th>
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold w-20">
              Rate
            </th>
            <th className="border border-black px-1 h-10 align-center pb-1 text-center font-bold w-24">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedItems).flatMap(([articleName, sizes], pIdx) =>
            Object.entries(sizes).map(([size, colors], sIdx) => {
              let totalQtyInRow = 0;
              let rate = 0;

              // Find first item in group to get category/group info
              const firstItem = Object.values(colors)[0];
              const product = products?.find(
                (p) => p.id === firstItem.productId,
              );
              const category = categories.find(
                (c) => c.id === product?.categoryId,
              );
              const groupName = category?.name || "General";

              const colorQtys = colorsList.map((cName) => {
                const item = colors[cName];
                if (item) {
                  totalQtyInRow += item.packetQuantity;
                  // Rate is price per item (unit price)
                  rate = item.pricePerItem;
                  return item.packetQuantity;
                }
                return 0;
              });

              // Amount = Qty (packets) * ItemsPerPacket * PricePerItem
              const amount =
                totalQtyInRow *
                firstItem.itemsPerPacket *
                firstItem.pricePerItem;

              return (
                <tr key={`${pIdx}-${sIdx}`} className="h-7">
                  <td className="border border-black p-1 text-center align-middle">
                    {pIdx + 1}
                  </td>
                  <td className="border border-black p-1 text-center align-middle font-bold">
                    {articleName}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {groupName}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {size}
                  </td>
                  {colorQtys.map((qty, idx) => (
                    <td
                      key={idx}
                      className="border border-black p-1 text-center align-middle"
                    >
                      {qty || ""}
                    </td>
                  ))}
                  <td className="border border-black p-1 text-center align-middle font-bold">
                    {totalQtyInRow}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {rate.toFixed(0)}
                  </td>
                  <td className="border border-black p-1 text-center align-middle font-bold">
                    {amount.toFixed(0)}
                  </td>
                </tr>
              );
            }),
          )}
          {/* Fill empty rows to match image style */}
          {Array.from({
            length: Math.max(
              0,
              -Object.values(groupedItems).reduce(
                (acc, sizes) => acc + Object.keys(sizes).length,
                0,
              ),
            ),
          }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-7">
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              {colorsList.map((_, idx) => (
                <td key={idx} className="border border-black p-1"></td>
              ))}
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50">
            <td colSpan={3 + colorsList.length}></td>
            <td
              colSpan={3}
              className="border border-black p-1 text-center align-middle text-[12px] tracking-wider"
            >
              Total Amount
            </td>
            <td
              colSpan={1}
              className="border border-black p-1 text-center align-center font-middle text-[13px] tracking-normal"
            >
              {bill.totalAmount.toFixed(0)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-14 flex justify-between items-end">
        <div className="border-t border-black w-48 text-center pt-1 text-xs">
          Customer Signature
        </div>
        <div className="border-t border-black w-48 text-center pt-1 text-xs">
          Authorized Signature
        </div>
      </div>
    </div>
  );
}
