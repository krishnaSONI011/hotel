"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TransportSection from "@/components/TransportSection";
import CitySection from "@/components/CitySection";
import PriceSummary from "@/components/PriceSummary";
import { apiRequest } from "@/lib/api.js";



type Destination = { id: number | null; city: string; nights: number };
type RoomSelection = { roomId: number; extraBed: boolean };

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
//  its a error in the code, i have to fix it
// const [selectedSightseeing, setSelectedSightseeing] = 
// useState([]);
// const onToggleSightseeing = (sight, checked) => {
//   setSelectedSightseeing((prev) => {
//     if (checked) return [...prev, sight];
//     return prev.filter((x) => !(x.id === sight.id && x.
//     cityId === sight.cityId));
//   });
// };
type BookingDetailsData = {
  transport: { from: string; to: string; options: any[] };
  cities: any[];
};

export default function BookingDetailsPage() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [detailsData, setDetailsData] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTransport, setSelectedTransport] = useState<any | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<{ [cityName: string]: RoomSelection[] }>({});
  const [selectedSightseeing, setSelectedSightseeing] = useState<any[]>([]);

  const onToggleSightseeing = (sight: any, checked: boolean) => {
    setSelectedSightseeing((prev) => {
      if (checked) return [...prev, sight];
      return prev.filter((x) => !(x.id === sight.id && x.cityId === sight.cityId));
    });
  };

  // Load booking data from session and fetch details
  useEffect(() => {
    const stored = sessionStorage.getItem("bookingForm");
    console.log("Stored bookingForm:", stored);

    if (!stored) {
      setLoading(false);
      return;
    }

    const parsed: BookingData = JSON.parse(stored);
    setBookingData(parsed);

    const fetchBookingDetails = async () => {
      try {
        
        const response = await apiRequest("/booking", "POST", parsed);
        console.log("Booking API response:", response);

        if (response.success && response.bookingDetails) {
          setDetailsData(response.bookingDetails);

          // Do not preselect any room; user must select manually.
          if (parsed.addTransfers && response.bookingDetails.cities) {
            const initialRooms: { [cityName: string]: RoomSelection[] } = {};
            response.bookingDetails.cities.forEach((city: any, idx: number) => {
              const cityKey =
                city.name || city.city || String(city.city_id || city.id || idx);
              initialRooms[cityKey] = [];
            });
            setSelectedRooms(initialRooms);
          }

        } else {
          console.warn("⚠️ API did not return bookingDetails, using fallback.");
          // ✅ Dummy fallback so UI works
          setDetailsData({
            transport: {
              from: parsed.leavingFrom || "City A",
              to: parsed.destinations?.[0]?.city || "City B",
              options: [
                { id: 1, car_type: "Sedan", price_per_day: 2000, seating_capacity: 4 },
                { id: 2, car_type: "SUV", price_per_day: 3500, seating_capacity: 6 },
              ],
            },
            cities: parsed.addTransfers
              ? [
                  {
                    name: "Sample City",
                    rooms: [
                      { room_id: 101, name: "Deluxe Room", extra_bed: false },
                      { room_id: 102, name: "Suite", extra_bed: true },
                    ],
                  },
                ]
              : [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch booking details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, []);

  useEffect(() => {
  console.log("==== DEBUG SNAPSHOT ====");
  console.log("destinations:", bookingData?.destinations);
  console.log("cities:", detailsData?.cities);
  console.log("selectedRooms:", selectedRooms);
}, [bookingData, detailsData, selectedRooms]);


  // Toggle room selection
const handleToggleRoom = (
  cityId: string | number,
  room: any,
  options: { extraBed?: boolean },
  checked: boolean
) => {
  setSelectedRooms((prev) => {
    const existing = prev[cityId] || [];

    if (checked) {
      const exists = existing.find((r) => r.roomId === (room.roomId ?? room.room_id));

      if (exists) {
        // ✅ Update existing selection with new options
        return {
          ...prev,
          [cityId]: existing.map((r) =>
            r.roomId === (room.roomId ?? room.room_id)
              ? { ...r, ...options }
              : r
          ),
        };
      } else {
        // ✅ Store complete room details, not just ID
        return {
          ...prev,
          [cityId]: [
            ...existing,
            {
              ...room,
              roomId: room.roomId ?? room.room_id,
              extraBed: !!options.extraBed,
            },
          ],
        };
      }
    } else {
      // ✅ Remove deselected room
      return {
        ...prev,
        [cityId]: existing.filter(
          (r) => r.roomId !== (room.roomId ?? room.room_id)
        ),
      };
    }
  });
};


const handleHotelChange = (cityName: string, newHotel: any) => {
  if (!newHotel) return;

  const normalizedRooms = (newHotel.rooms || []).map((room: any) => ({
    ...room,
    room_id: room.room_id ?? room.id,
    hotel_name: newHotel.hotel_name,
    hotel_id: newHotel.hotel_id,
  }));

  // 1️⃣ clear selected rooms for this city
  setSelectedRooms((prev) => ({
    ...prev,
    [cityName]: [],
  }));

  // 2️⃣ replace hotel rooms WITH NORMALIZED DATA
  setDetailsData((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      cities: prev.cities.map((city: any) => {
        if (city.name !== cityName) return city;

        return {
          ...city,
          hotel: normalizedRooms,
          rooms: normalizedRooms,
          hotel_name: newHotel.hotel_name,
          hotel_id: newHotel.hotel_id,
        };
      }),
    };
  });
};


  // Build final payload
  const getFinalPayload = () => {
    if (!bookingData) return null;
    return {
      ...bookingData,
      destinations: bookingData.addTransfers
        ? bookingData.destinations.map((dest) => ({
            ...dest,
            rooms: selectedRooms[dest.city] || [],
          }))
        : [],
      selectedTransport,
    };
  };

  
  if (loading) return <ProtectedRoute><p>Loading booking details...</p></ProtectedRoute>;
  if (!bookingData) return <p>⚠️ No booking form data found in sessionStorage.</p>;
  if (!detailsData) return <p>⚠️ API did not return booking details and no fallback set.</p>;

  return (
    <ProtectedRoute>
    <div className="p-6 grid grid-cols-12 gap-6">
      <div className="col-span-9 space-y-6">
        <h1 className="text-2xl font-bold">Your Trip Details</h1>

        {/* Transport */}
        <TransportSection
          transport={detailsData.transport}
          selected={selectedTransport}
          onSelect={setSelectedTransport}
          totalTravellers={bookingData.travellers}
        />

        {/* Hotels / Cities */}
        {bookingData.addTransfers &&
          detailsData.cities.map((city, index) => {
            // Try to find matching destination to get the real cityId (DB id)
            const matchDest = bookingData.destinations.find(
              (d) =>
                d.city &&
                (city?.name || city?.city) &&
                d.city.toLowerCase() === String(city.name || city.city).toLowerCase()
            );

            const cityIdForApis =
              matchDest?.id ??
              city.hotel?.[0]?.city_id ??
              index;

            return (
              <CitySection
                key={`${cityIdForApis}-${index}`}
                city={city}
                cityId={cityIdForApis}
                selectedRooms={selectedRooms[city.name] || []}
                onToggleRoom={(room, options, checked) =>
                  handleToggleRoom(city.name, room, options, checked)
                }
                onHotelChange={(_, newHotel) =>
                  handleHotelChange(city.name, newHotel)
                }
                travelDate={bookingData.leavingOn}
                selectedSightseeing={selectedSightseeing}
                onToggleSightseeing={onToggleSightseeing}
              />
            );
          })}
      
      </div>

      {/* Price Summary */}
      <div className="col-span-3">
        <PriceSummary
          bookingData={getFinalPayload()}
          detailsData={detailsData}
          selectedTransport={selectedTransport}
          selectedRooms={selectedRooms}
          selectedSightseeing={selectedSightseeing}
        />
      </div>
    </div>
</ProtectedRoute>
  );
}
