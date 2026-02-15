import React from "react";

/* -----------------------------
   Types
----------------------------- */

type TransportOption = {
  id: number;
  car_type?: string;
  name?: string;
  seating_capacity?: number | string;
  price_per_day?: number | string;
};

type TransportData = {
  options: TransportOption[];
};

type SelectedTransport = TransportOption & {
  vehiclesNeeded?: number;
  totalCost?: number;
};

type Props = {
  transport: TransportData;
  selected: SelectedTransport | null;
  onSelect: (transport: SelectedTransport) => void;
  totalTravellers: number;
};

/* -----------------------------
   Component
----------------------------- */

export default function TransportSection({
  transport,
  selected,
  onSelect,
  totalTravellers,
}: Props) {
  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-3">Transport Options</h2>

      {transport.options.map((opt) => {
        const seatingCapacity =
          typeof opt.seating_capacity === "string"
            ? parseInt(opt.seating_capacity, 10)
            : opt.seating_capacity || 1;

        const vehiclesNeeded =
          totalTravellers > 0
            ? Math.ceil(totalTravellers / (seatingCapacity > 0 ? seatingCapacity : 1))
            : 1;

        return (
          <label key={opt.id} className="flex items-center space-x-3 mb-2">
            <input
              type="radio"
              name="transport"
              checked={selected?.id === opt.id}
              onChange={() =>
                onSelect({
                  ...opt,
                  vehiclesNeeded,
                  totalCost:
                    vehiclesNeeded * Number(opt.price_per_day || 0),
                })
              }
            />

            <span>
              {opt.car_type || opt.name} — ₹{opt.price_per_day}/day (Seats:{" "}
              {opt.seating_capacity || "N/A"})
              {totalTravellers > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  → {vehiclesNeeded} vehicle(s) needed
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
