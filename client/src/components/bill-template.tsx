import { format } from "date-fns";
import type { Bill } from "@shared/schema";
import { useSettings } from "@/hooks/use-settings";

interface BillTemplateProps {
  bill: Bill;
}

export function BillTemplate({ bill }: BillTemplateProps) {
  const { settings } = useSettings();

  const totalQty = bill.items.reduce((sum, item) => sum + (item.qty ?? 1), 0);

  const gross = bill.items.reduce((sum, item) => {
    return sum + (item.qty ?? 1) * item.pricePerItem;
  }, 0);

  const totalItemDiscount = bill.items.reduce((sum, item) => {
    return sum + (item.qty ?? 1) * (item.discountPerItem || 0);
  }, 0);

  const discount = (bill.discountOnBill || 0) + totalItemDiscount;
  const net = bill.totalAmount;

  return (
    <div
      id="bill-print-template"
      className="bg-white text-black mx-auto p-2 font-sans"
      style={{ width: "80mm" }}
    >
      <p className="text-center text-[10px]">Purchase Slip</p>

      <h2 className="text-center text-sm font-bold">
        {settings?.storeName || "PHARMACY & MART"}
      </h2>

      <p className="text-center text-[10px]">
        {settings?.storeAddress || ""}
      </p>

      <p className="text-center text-[10px]">
        PH# {settings?.storePhone || ""}
      </p>

      <hr className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between text-[10px]">
        <span>Date: {format(new Date(bill.date), "dd-MM-yyyy")}</span>
        <span>Time: {format(new Date(bill.date), "HH:mm")}</span>
      </div>

      <div className="flex justify-between text-[10px]">
        <span>Pos: 01</span>
        <span>Mop: Cash</span>
      </div>

      <p className="text-[10px] mt-1">Receipt #: {bill.billNumber}</p>

      {bill.customerName && (
        <p className="text-[10px]">
          Customer: {bill.customerName}
          {bill.customerPhone ? ` | ${bill.customerPhone}` : ""}
        </p>
      )}

      <hr className="border-t border-dashed border-black my-2" />

      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="text-left w-5">Sr</th>
            <th className="text-left">Medicine</th>
            <th className="text-right">Rate</th>
            <th className="text-right w-8">Qty</th>
            <th className="text-right">Amt</th>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr className="border-t border-dashed border-black my-1" />
            </td>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, index) => {
            const qty = item.qty ?? 1;
            const lineTotal = qty * (item.pricePerItem - (item.discountPerItem || 0));
            return (
              <tr key={index}>
                <td className="align-top">{index + 1}</td>
                <td className="align-top">
                  {item.medicineName}
                  {item.discountPerItem ? (
                    <span className="text-[8px]"> (-{item.discountPerItem}/item)</span>
                  ) : null}
                </td>
                <td className="text-right align-top">{item.pricePerItem.toFixed(0)}</td>
                <td className="text-right align-top">{qty}</td>
                <td className="text-right align-top">{lineTotal.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <hr className="border-t border-dashed border-black my-1" />

      {/* Summary Section */}
      <div className="text-[10px]">
        <div className="flex justify-between font-semibold">
          <span>Gross Total:</span>
          <span>{gross.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9px] text-gray-600">
          <span>Total Items:</span>
          <span>{totalQty} pcs</span>
        </div>
      </div>

      <hr className="border-t border-dashed border-black my-1" />

      {totalItemDiscount > 0 && (
        <div className="flex justify-between text-[10px]">
          <span>Item Discounts:</span>
          <span>- {totalItemDiscount.toFixed(2)}</span>
        </div>
      )}

      {(bill.discountOnBill || 0) > 0 && (
        <div className="flex justify-between text-[10px]">
          <span>Bill Discount:</span>
          <span>- {(bill.discountOnBill || 0).toFixed(2)}</span>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between text-[10px] font-semibold">
          <span>Total Discount:</span>
          <span>- {discount.toFixed(2)}</span>
        </div>
      )}

      {discount === 0 && (
        <div className="flex justify-between text-[10px]">
          <span>Discount:</span>
          <span>0.00</span>
        </div>
      )}

      <div className="flex justify-between text-[10px]">
        <span>Adjustment:</span>
        <span>0.00</span>
      </div>

      <div className="flex justify-between text-[11px] font-bold border-t border-black pt-1 mt-1">
        <span>Net Total:</span>
        <span>{net.toFixed(2)}</span>
      </div>

      <hr className="border-t border-dashed border-black my-2" />

      <p className="text-[9px] leading-4">
        {settings?.invoiceFooter || "Thank you for shopping with us!"}<br />
        Medicines can be exchanged within 7 days with original bill.<br />
        No claims will be accepted after leaving counter.<br />
        Test strips, syrups, inhalers, refrigerated items, or opened medicines
        are not returnable.<br />
        Imported items are not exchangeable or returnable.<br />
        Thank you.
      </p>
    </div>
  );
}
