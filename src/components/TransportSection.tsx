import React from "react";

export default function TransportSection({ transport, selected, onSelect, totalTravellers }) {
  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white">
      <h2 className="text-xl font-semibold mb-3">Transport Options</h2>
      {transport.options.map((opt) => {
        const seatingCapacity = parseInt(opt.seating_capacity, 10);
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
                  vehiclesNeeded, // send calculated value
                  totalCost: vehiclesNeeded * Number(opt.price_per_day || 0), // also send cost
                })
              }
            />
            <span>
              {opt.car_type} — ₹{opt.price_per_day}/day (Seats: {opt.seating_capacity || "N/A"})  
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
