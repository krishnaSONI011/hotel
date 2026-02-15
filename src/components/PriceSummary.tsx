import React, { useMemo } from "react";

type SelectedRoomsMap = {
  [cityName: string]: { roomId: number; extraBed: boolean }[];
};

type Props = {
  bookingData: any;
  detailsData: any;
  selectedTransport: any | null;
  selectedRooms: SelectedRoomsMap;
};

export default function PriceSummary({
  bookingData,
  detailsData,
  selectedTransport,
  selectedRooms,
}: Props) {
  // --- Flatten selectedRooms into usable list (must run before any early return) ---
  const selectedRoomsFlat = useMemo(() => {
    const flat: any[] = [];
    if (!selectedRooms || !detailsData?.cities) return flat;

    for (const [cityName, selections] of Object.entries(selectedRooms)) {
      const city = detailsData.cities.find((c: any) => c.name === cityName);
      if (!city) continue;

      for (const sel of selections) {
        const cityRooms = Array.isArray(city.hotel)
          ? city.hotel
          : Array.isArray(city.rooms)
            ? city.rooms
            : [];

        const roomObj = cityRooms.find(
          (r: any) =>
            Number(r.room_id ?? r.roomId ?? r.id) === Number((sel as any).roomId)
        );
        if (!roomObj) continue;

        flat.push({
          ...roomObj,
          cityName,
          nights: Number(city.nights) || 0,
          extraBedSelected: !!sel.extraBed,
        });
      }
    }

    return flat;
  }, [selectedRooms, detailsData]);

  // --- Group by hotel for display (must run before any early return) ---
  const groupedByHotel = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of selectedRoomsFlat) {
      const key = r.hotel_name || `${r.hotel_id || "hotel"}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [selectedRoomsFlat]);

  // --- Early return after all hooks ---
  if (!bookingData || !detailsData) return null;

  // --- number of journey days = sum of nights + 1 ---
  const journeyDays =
    (bookingData.destinations || []).reduce(
      (s: number, d: any) => s + (Number(d.nights) || 0),
      0
    ) + 1;

  // --- determine season (Oct - Dec) ---
  const leavingOn = bookingData.leavingOn;
  const leavingMonth =
    leavingOn && !Number.isNaN(new Date(leavingOn).getTime())
      ? new Date(leavingOn).getMonth() + 1
      : null;
  const isSeason =
    leavingMonth ? leavingMonth >= 10 && leavingMonth <= 12 : false;

  // --- Calculate total travellers ---
  const totalTravellers =
    (Number(bookingData?.adults) || 0) +
    ((bookingData?.childAges || []).filter(
      (age: number) => Number(age) > 6
    ).length || 0);

  // --- Calculate number of vehicles needed ---
  const seatingCapacity = Number(selectedTransport?.seating_capacity) || 1;
  const vehiclesNeeded =
    Number(selectedTransport?.vehiclesNeeded) ||
    (totalTravellers > 0 ? Math.ceil(totalTravellers / seatingCapacity) : 1);

  // --- Transport cost (scales by vehiclesNeeded) ---
  const transportCost =
    (Number(selectedTransport?.price_per_day) || 0) *
    journeyDays *
    vehiclesNeeded;

  // --- Hotel cost (DO NOT multiply by vehiclesNeeded) ---
  const hotelCost = selectedRoomsFlat.reduce((sum: number, r: any) => {
    const baseRate = isSeason
      ? Number(r.season_rate) || 0
      : Number(r.off_season_rates) || 0;
    const extraBedRate = isSeason
      ? Number(r.season_extra_bed) || 0
      : Number(r.extra_bed) || 0;
    const nights = Number(r.nights) || 0;

    const roomTotal =
      (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
      nights *
      bookingData.rooms;

    return sum + roomTotal;
  }, 0);

  const finalTotal = transportCost + hotelCost;

  // --- Confirm handler ---
  const handleConfirm = () => {
  const selection = {
    transport: {
      ...selectedTransport,
      vehiclesNeeded, // ensure saved
      totalCost: transportCost, // ensure saved
    },
    selectedRooms,
    totals: {
      journeyDays,
      transportCost,
      hotelCost,
      finalTotal,
      travellers: totalTravellers, // optional but useful
    },
  };

  sessionStorage.setItem("bookingSelection", JSON.stringify(selection));
  alert("Selection saved for next step!");
};


  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white sticky top-4">
      <h2 className="text-xl font-bold mb-2">Price Summary {totalTravellers}</h2>

      {/* Transport */}
      <div className="mb-3">
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-700 font-medium">Transport</div>
            {selectedTransport ? (
              <div className="text-sm">
                {selectedTransport.car_type || selectedTransport.name} —{" "}
                {vehiclesNeeded} vehicle(s)
              </div>
            ) : (
              <div className="text-sm text-gray-500">No transport selected</div>
            )}
          </div>
          <div className="text-sm font-semibold">
            ₹{Number(selectedTransport?.price_per_day || 0)} × {journeyDays} days ×{" "}
            {vehiclesNeeded} vehicle(s) = ₹{transportCost}
          </div>
        </div>
      </div>

      {/* Hotels & rooms */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-2">Hotels & Rooms</h3>
        {selectedRoomsFlat.length === 0 ? (
          <p className="text-sm text-gray-500">No rooms selected</p>
        ) : (
          Object.entries(groupedByHotel).map(([hotelName, rooms]) => {
            const hotelSubtotal = rooms.reduce((s: number, r: any) => {
              const baseRate = isSeason
                ? Number(r.season_rate) || 0
                : Number(r.off_season_rates) || 0;
              const extraBedRate = isSeason
                ? Number(r.season_extra_bed) || 0
                : Number(r.extra_bed) || 0;
              const nights = Number(r.nights) || 0;

              return (
                s +
                (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
                  nights *
                  bookingData.rooms
              );
            }, 0);

            return (
              <div key={hotelName} className="border rounded p-2 mb-2 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{hotelName}</div>
                    <div className="text-sm text-gray-600">{rooms[0]?.address || ""}</div>
                  </div>
                  <div className="font-semibold">₹{hotelSubtotal}</div>
                </div>

                <div className="mt-2 space-y-2">
                  {rooms.map((r: any) => {
                    const baseRate = isSeason
                      ? Number(r.season_rate) || 0
                      : Number(r.off_season_rates) || 0;
                    const extraBedRate = isSeason
                      ? Number(r.season_extra_bed) || 0
                      : Number(r.extra_bed) || 0;
                    const nights = Number(r.nights) || 0;

                    const roomCost =
                      (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
                      nights *
                      bookingData.rooms;

                    return (
                      <div key={r.room_id} className="text-sm bg-white p-2 rounded border">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">
                              {r.room_categories_name || r.room}
                            </div>
                            <div className="text-xs text-gray-600">
                              City: {r.cityName} — {nights} night(s)
                            </div>
                          </div>
                          <div className="text-sm font-semibold">₹{roomCost}</div>
                        </div>

                        <div className="mt-1 text-xs text-gray-700">
                          Base: ₹{baseRate} × {nights} × {bookingData.rooms} = ₹
                          {baseRate * nights * bookingData.rooms}
                          {r.extraBedSelected ? (
                            <div>
                              Extra bed: ₹{extraBedRate} × {nights} × {bookingData.rooms} = ₹
                              {extraBedRate * nights * bookingData.rooms}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <hr className="my-2" />

      {/* Totals */}
      <div className="flex justify-between mt-2">
        <div className="font-medium">Hotels</div>
        <div className="font-medium">₹{hotelCost}</div>
      </div>
      <div className="flex justify-between mt-1">
        <div className="font-medium">Transport</div>
        <div className="font-medium">₹{transportCost}</div>
      </div>

      <div className="mt-3 text-lg font-semibold flex justify-between">
        <div>Total</div>
        <div>₹{finalTotal}</div>
      </div>

      <button
        onClick={handleConfirm}
        className="mt-4 w-full bg-blue-600 text-white p-2 rounded-lg"
      >
        Confirm & Continue
      </button>
    </div>
  );
}
