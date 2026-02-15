"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TransportSection from "@/components/TransportSection";
import CitySection from "@/components/CitySection";
import PriceSummary from "@/components/PriceSummary";
import { apiRequest } from "@/lib/api.js";

/* ================= TYPES ================= */

type Destination = {
  id: number | null;
  city_id: number;
  city: string;
  nights: number;
};

type RoomSelection = {
  roomId: number;
  extraBed: boolean;
};

type BookingData = {
  destinations: Destination[];
  leavingFrom: string;
  leavingFromId: number | null;
  nationality: string;
  leavingOn: string;
  travellers: number;
  adults: number;
  children: number;
  childAges: number[];
  rooms: number;
  starCategory: number;
  addTransfers: boolean;
  landOnly: boolean;
};

type BookingDetailsData = {
  transport: { from: string; to: string; options: any[] };
  cities: any[];
};

/* ================= COMPONENT ================= */

export default function BookingDetailsPage() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [detailsData, setDetailsData] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTransport, setSelectedTransport] = useState<any | null>(null);

  // cityId → selected rooms
  const [selectedRooms, setSelectedRooms] = useState<{
    [cityId: number]: RoomSelection[];
  }>({});

  /* ================= LOAD + NORMALIZE DATA ================= */

  useEffect(() => {
    const stored = sessionStorage.getItem("bookingForm");
    if (!stored) {
      setLoading(false);
      return;
    }

    const parsed: BookingData = JSON.parse(stored);
    setBookingData(parsed);

    const fetchBookingDetails = async () => {
      try {
        const response = await apiRequest("/booking", "POST", parsed);

        if (response?.success && response.bookingDetails) {
          const apiDetails = response.bookingDetails;

          // 🔒 NORMALIZE CITIES USING bookingData.destinations
          const normalizedCities = parsed.destinations.map((dest) => {
            const apiCity = apiDetails.cities.find(
              (c: any) =>
                c.city_id === dest.city_id ||
                c.name?.toLowerCase() === dest.city.toLowerCase()
            );

            return {
              ...apiCity,
              city_id: dest.city_id,
              name: dest.city,
              nights: dest.nights,
              hotel: (apiCity?.hotel || []).map((room: any) => ({
                ...room,
                hotel_name: apiCity?.hotel_name ?? room.hotel_name,
              })),
            };
          });

          setDetailsData({
            ...apiDetails,
            cities: normalizedCities,
          });

          // init empty selections per city
          const initRooms: { [id: number]: RoomSelection[] } = {};
          parsed.destinations.forEach((d) => {
            initRooms[d.city_id] = [];
          });
          setSelectedRooms(initRooms);
        }
      } catch (err) {
        console.error("Failed to fetch booking details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, []);

  /* ================= ROOM TOGGLE ================= */
const handleToggleRoom = (
  cityId: number,
  room: any,
  options: { extraBed?: boolean },
  checked: boolean
) => {
  setSelectedRooms((prev: any) => {
    const cityRooms = prev[cityId] || [];

    if (!checked) {
      return {
        ...prev,
        [cityId]: cityRooms.filter(
          (r: any) => r.roomId !== room.roomId
        ),
      };
    }

    const existing = cityRooms.find(
      (r: any) => r.roomId === room.roomId
    );

    if (existing) {
      return {
        ...prev,
        [cityId]: cityRooms.map((r: any) =>
          r.roomId === room.roomId
            ? { ...r, extraBed: options.extraBed }
            : r
        ),
      };
    }

    // ✅ APPEND NEW DATA (NO DELETE)
    return {
      ...prev,
      [cityId]: [
        ...cityRooms,
        {
          roomId: room.roomId,
          extraBed: !!options.extraBed,

          // ✅ NEW (fallback ke liye)
          room,
          cityId,
          cityName: room.cityName,
          nights: room.nights,
        },
      ],
    };
  });
};

//   const handleToggleRoom = (
//   cityId: number,
//   room: any,
//   options: { extraBed?: boolean },
//   checked: boolean
// ) => {
//   setSelectedRooms((prev: any) => {
//     const cityRooms = prev[cityId] || [];

//     if (!checked) {
//       return {
//         ...prev,
//         [cityId]: cityRooms.filter(
//           (r: any) => r.roomId !== room.roomId
//         ),
//       };
//     }

//     const exists = cityRooms.find(
//       (r: any) => r.roomId === room.roomId
//     );

//     if (exists) {
//       return {
//         ...prev,
//         [cityId]: cityRooms.map((r: any) =>
//           r.roomId === room.roomId
//             ? { ...r, extraBed: !!options.extraBed }
//             : r
//         ),
//       };
//     }

//     return {
//       ...prev,
//       [cityId]: [
//         ...cityRooms,
//         {
//           roomId: room.roomId,
//           extraBed: !!options.extraBed,
//           room,                  // ✅ FULL ROOM
//           cityId,
//           cityName: room.city_name || "",
//           nights: room.nights,
//         },
//       ],
//     };
//   });
// };

  // const handleToggleRoom = (
  //   cityId: number,
  //   room: any,
  //   options: { extraBed?: boolean },
  //   checked: boolean
  // ) => {
  //   const roomId = room.roomId ?? room.room_id;

  //   setSelectedRooms((prev) => ({
  //     ...prev,
  //     [cityId]: checked ? [{ roomId, extraBed: !!options.extraBed }] : [],
  //   }));
  // };

  /* ================= HOTEL CHANGE ================= */

  const handleHotelChange = (cityId: number, newHotel: any) => {
    // clear room selection
    setSelectedRooms((prev) => ({
      ...prev,
      [cityId]: [],
    }));

    // update hotel ONLY for this city
    setDetailsData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        cities: prev.cities.map((city: any) =>
          city.city_id !== cityId
            ? city
            : {
                ...city,
                hotel: (newHotel.rooms || []).map((room: any) => ({
                  ...room,
                  hotel_name: newHotel.hotel_name,
                  hotel_id: newHotel.hotel_id,
                })),
                hotel_name: newHotel.hotel_name,
                hotel_id: newHotel.hotel_id,
              }
        ),
      };
    });
  };

  /* ================= FINAL PAYLOAD ================= */

  const getFinalPayload = () => {
    if (!bookingData) return null;

    return {
      ...bookingData,
      destinations: bookingData.destinations.map((dest) => ({
        ...dest,
        rooms: selectedRooms[dest.city_id] || [],
      })),
      selectedTransport,
    };
  };

  /* ================= RENDER ================= */

  if (loading)
    return (
      <ProtectedRoute>
        <p>Loading booking details...</p>
      </ProtectedRoute>
    );

  if (!bookingData || !detailsData)
    return <p>⚠️ Booking data not available.</p>;

  return (
    <ProtectedRoute>
      <div className="p-6 grid grid-cols-12 gap-6">
        <div className="col-span-9 space-y-6">
          <h1 className="text-2xl font-bold">Your Trip Details</h1>

          <TransportSection
            transport={detailsData.transport}
            selected={selectedTransport}
            onSelect={setSelectedTransport}
            totalTravellers={bookingData.travellers}
          />

          {/* ✅ MULTIPLE CITIES — STABLE */}
       {bookingData.addTransfers &&
  bookingData.destinations.map((dest, index) => {
    // Find matching hotel data by city name
    const cityDetails = detailsData.cities.find(
      (c: any) =>
        c.city_id === dest.city_id ||
        c.name?.toLowerCase() === dest.city.toLowerCase()
    );

    if (!cityDetails) return null;

    return (
      <CitySection
        key={`${dest.city_id}-${index}`} // ✅ stable + unique
        city={{
          ...cityDetails,
          city_id: dest.city_id, // 🔒 force city_id
          name: dest.city,
          nights: dest.nights,
        }}
        cityId={dest.city_id}
        selectedRooms={selectedRooms[dest.city_id] || []}
        onToggleRoom={(room, options, checked) =>
          handleToggleRoom(dest.city_id, room, options, checked)
        }
        onHotelChange={(hotelId, hotel) =>
          handleHotelChange(dest.city_id, hotel)
        }
        travelDate={bookingData.leavingOn}
      />
    );
  })}


        </div>

        <div className="col-span-3">
          <PriceSummary
            bookingData={getFinalPayload()}
            detailsData={detailsData}
            selectedTransport={selectedTransport}
            selectedRooms={selectedRooms}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
