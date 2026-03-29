import { format } from "date-fns";
import type { Bill } from "@shared/schema";
import { useSettings } from "@/hooks/use-settings";

interface BillTemplateProps {
  bill: Bill;
}

export function BillTemplate({ bill }: BillTemplateProps) {
  const { settings } = useSettings();

  const totalQty = bill.items.reduce(
    (sum, item) => sum + item.packetQuantity,
    0
  );

  const gross = bill.items.reduce((sum, item) => {
    return sum + item.packetQuantity * item.pricePerItem;
  }, 0);

  const discount = bill.discountOnBill || 0;
  const net = gross - discount;

  return (
    <div
      id="bill-print-template"
      className="bg-white text-black mx-auto p-2 font-sans"
      style={{ width: "80mm" }}
    >
      {/* HEADER */}
      <p className="text-center text-[10px]">Purchase Slip</p>

      <h2 className="text-center text-sm font-bold">
        {settings?.storeName || "AJWA PHARMACY & MART"}
      </h2>

      <p className="text-center text-[10px]">
        {settings?.storeAddress || "NEAR THANA SADAR, LODHRAN"}
      </p>

      <p className="text-center text-[10px]">
        PH# {settings?.storePhone || "03016792892"}
      </p>

      <hr className="border-t border-dashed border-black my-2" />

      {/* DATE TIME */}
      <div className="flex justify-between text-[10px]">
        <span>
          Date: {format(new Date(bill.date), "dd-MM-yyyy")}
        </span>
        <span>
          Time: {format(new Date(bill.date), "HH:mm")}
        </span>
      </div>

      <div className="flex justify-between text-[10px]">
        <span>Pos: 01</span>
        <span>Mop: Cash</span>
      </div>

      <p className="text-[10px] mt-1">
        Receipt #: {bill.billNumber}
      </p>

      <hr className="border-t border-dashed border-black my-2" />

      {/* TABLE */}
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th>Sr</th>
            <th className="text-left">Medicine</th>
            <th className="text-right">Price</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Total</th>
          </tr>
          <tr>
            <td colSpan={5}>
              <hr className="border-t border-dashed border-black my-1" />
            </td>
          </tr>
        </thead>

        <tbody>
          {bill.items.map((item, index) => {
            const total = item.packetQuantity * item.pricePerItem;

            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.productName}</td>
                <td className="text-right">
                  {item.pricePerItem.toFixed(2)}
                </td>
                <td className="text-right">
                  {item.packetQuantity}
                </td>
                <td className="text-right">
                  {total.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <hr className="border-t border-dashed border-black my-2" />

      {/* TOTALS */}
      <div className="flex justify-between text-[10px]">
        <span>Gross Total:</span>
        <span>
          {totalQty} &nbsp;&nbsp;&nbsp; {gross.toFixed(2)}
        </span>
      </div>

      <br />

      <hr className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between text-[10px]">
        <span>Discount:</span>
        <span>{discount.toFixed(2)}</span>
      </div>

      <div className="flex justify-between text-[10px]">
        <span>Adjustment:</span>
        <span>0</span>
      </div>

      <div className="flex justify-between text-[11px] font-bold">
        <span>Net Total:</span>
        <span>{net.toFixed(2)}</span>
      </div>

      <hr className="border-t border-dashed border-black my-2" />

      {/* FOOTER */}
      <p className="text-[9px] leading-4">
        Thank you for your visit. <br />
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