import React from "react";

type TransportOption = {
  id: number | string;
  car_type?: string;
  name?: string;
  seating_capacity?: number | string;
  price_per_day?: number;
  [key: string]: any;
};

type Transport = {
  from?: string;
  to?: string;
  options?: TransportOption[];
};

type Props = {
  transport: Transport;
  selected: (TransportOption & { vehiclesNeeded?: number; totalCost?: number }) | null;
  onSelect: (option: TransportOption & { vehiclesNeeded?: number; totalCost?: number }) => void;
  totalTravellers: number;
};

export default function TransportSection({
  transport,
  selected,
  onSelect,
  totalTravellers,
}: Props) {
  const options = transport?.options ?? [];

  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-3">Transport Options</h2>
      {options.length === 0 ? (
        <p className="text-sm text-gray-500">No transport options available.</p>
      ) : (
        options.map((opt) => {
          const seatingCapacity = Number(opt.seating_capacity) || 0;
          const vehiclesNeeded =
            totalTravellers > 0
              ? Math.ceil(totalTravellers / (seatingCapacity > 0 ? seatingCapacity : 1))
              : 1;
          const pricePerDay = Number(opt.price_per_day) || 0;

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
                    totalCost: vehiclesNeeded * pricePerDay,
                  })
                }
              />
              <span>
                {opt.car_type ?? opt.name ?? "Vehicle"} — ₹{pricePerDay}/day (Seats:{" "}
                {opt.seating_capacity ?? "N/A"})
                {totalTravellers > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    → {vehiclesNeeded} vehicle(s) needed
                  </span>
                )}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
}
