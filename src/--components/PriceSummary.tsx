import React, { useMemo } from "react";

// type SelectedRoomsMap = {
//   [cityId: number]: { roomId: number; extraBed: boolean }[];
// };
type SelectedRoom = {
  roomId: number;
  extraBed: boolean;
  room: any;        // FULL room object
  cityId: number;
  cityName: string;
  nights: number;
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

  const safeBookingData = bookingData || {};
  const safeDetailsData = detailsData || {};
  const safeSelectedRooms = selectedRooms || {};

  /* -----------------------------
     JOURNEY DAYS
  ----------------------------- */
  const journeyDays =
    (safeBookingData.destinations || []).reduce(
      (s: number, d: any) => s + (Number(d.nights) || 0),
      0
    ) + 1;

  /* -----------------------------
     SEASON CHECK
  ----------------------------- */
  const leavingOn = safeBookingData.leavingOn;
  const leavingMonth =
    leavingOn && !Number.isNaN(new Date(leavingOn).getTime())
      ? new Date(leavingOn).getMonth() + 1
      : null;

  const isSeason =
    leavingMonth ? leavingMonth >= 10 && leavingMonth <= 12 : false;

  /* -----------------------------
     ✅ FIXED: FLATTEN SELECTED ROOMS
  ----------------------------- */
  const selectedRoomsFlat = useMemo(() => {
  const flat: any[] = [];

  if (!safeSelectedRooms || !safeDetailsData?.cities) return flat;

  for (const [cityIdStr, selections] of Object.entries(safeSelectedRooms)) {
    const cityId = Number(cityIdStr);

    const city = safeDetailsData.cities.find(
      (c: any) => Number(c.city_id) === cityId
    );

    if (!city) continue;

    for (const sel of selections as any[]) {
      // const roomObj = (city.hotel || []).find(
      //   (r: any) => Number(r.room_id) === Number(sel.roomId)
      // );
      // 🚫 skip agar city mismatch
      if (sel.cityId && sel.cityId !== cityId) continue;

      const roomObj = (city.hotel || []).find(
      (r: any) =>
        Number(r.room_id ?? r.id ?? r.roomId) === Number(sel.roomId)
    );


      // if (!roomObj) continue;

      flat.push({
        ...roomObj,
        cityId,
        cityName: city.name,
        nights: Number(city.nights) || 0,
        extraBedSelected: !!sel.extraBed,
      });
    }
  }

  return flat;
}, [safeSelectedRooms, safeDetailsData]);


  /* -----------------------------
     TRAVELLERS
  ----------------------------- */
  const totalTravellers =
    (Number(safeBookingData?.adults) || 0) +
    ((safeBookingData?.childAges || []).filter(
      (age: number) => Number(age) > 6
    ).length || 0);

  /* -----------------------------
     VEHICLES
  ----------------------------- */
  const vehiclesNeeded =
    Number(selectedTransport?.vehiclesNeeded) ||
    (totalTravellers > 0
      ? Math.ceil(
          totalTravellers /
            (Number(selectedTransport?.seating_capacity) || 1)
        )
      : 1);

  /* -----------------------------
     COSTS
  ----------------------------- */
  const transportCost =
    (Number(selectedTransport?.price_per_day) || 0) *
    journeyDays *
    vehiclesNeeded;

  const hotelCost = selectedRoomsFlat.reduce((sum: number, r: any) => {
    const baseRate = isSeason
      ? Number(r.season_rate) || 0
      : Number(r.off_season_rates) || 0;

    const extraBedRate = isSeason
      ? Number(r.season_extra_bed) || 0
      : Number(r.extra_bed) || 0;

    const nights = Number(r.nights) || 0;

    return (
      sum +
      (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
        nights *
        safeBookingData.rooms
    );
  }, 0);

  const finalTotal = transportCost + hotelCost;

  /* -----------------------------
     GROUP ROOMS BY HOTEL (UNCHANGED)
  ----------------------------- */
  const groupedByHotel = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of selectedRoomsFlat) {
      const key = r.hotel_name || `${r.hotel_id || "hotel"}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [selectedRoomsFlat]);

  if (!bookingData || !detailsData) return null;

  /* -----------------------------
     RENDER (UNCHANGED)
  ----------------------------- */
  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white sticky top-4">
      <h2 className="text-xl font-bold mb-2">
        Price Summary ({totalTravellers})
      </h2>

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
            ₹{Number(selectedTransport?.price_per_day || 0)} × {journeyDays} ×{" "}
            {vehiclesNeeded} = ₹{transportCost}
          </div>
        </div>
      </div>

      {/* Hotels */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-2">Hotels & Rooms</h3>

        {selectedRoomsFlat.length === 0 ? (
          <p className="text-sm text-gray-500">No rooms selected</p>
        ) : (
          Object.entries(groupedByHotel).map(([hotelName, rooms]) => (
  <div key={hotelName} className="border rounded p-2 mb-2 bg-gray-50">
    
    {/* Hotel Header */}
    <div className="flex justify-between mb-1">
      <div className="font-medium">{hotelName}</div>
      <div className="font-semibold">
        ₹{rooms.reduce((s: number, r: any) => {
          const baseRate = isSeason
            ? Number(r.season_rate) || 0
            : Number(r.off_season_rates) || 0;
          const extraBedRate = isSeason
            ? Number(r.season_extra_bed) || 0
            : Number(r.extra_bed) || 0;

          return (
            s +
            (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
              Number(r.nights || 0) *
              safeBookingData.rooms
          );
        }, 0)}
      </div>
    </div>

    {/* Rooms */}
    <div className="text-sm text-gray-700 space-y-1 pl-2">
      {rooms.map((r: any, idx: number) => {
        const baseRate = isSeason
          ? Number(r.season_rate) || 0
          : Number(r.off_season_rates) || 0;

        const extraBedRate = isSeason
          ? Number(r.season_extra_bed) || 0
          : Number(r.extra_bed) || 0;

        const roomTotal =
          (baseRate + (r.extraBedSelected ? extraBedRate : 0)) *
          Number(r.nights || 0) *
          safeBookingData.rooms;

        return (
          <div key={idx} className="flex justify-between">
            <div>
              <div>
                • {r.room_categories_name || r.room_name || "Room"}
              </div>
              <div className="text-xs text-gray-500">
                {r.nights} night(s)
                {r.extraBedSelected && ` · Extra bed`}
              </div>
            </div>
            <div className="text-sm font-medium">₹{roomTotal}</div>
          </div>
        );
      })}
    </div>

  </div>
))

        )}
      </div>

      <hr className="my-2" />

      <div className="flex justify-between font-semibold">
        <div>Total</div>
        <div>₹{finalTotal}</div>
      </div>
    </div>
  );
}
