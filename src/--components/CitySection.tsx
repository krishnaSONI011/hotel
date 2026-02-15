import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api.js";

type Selection = {
  roomId: number;
  extraBed?: boolean;
};

type Room = {
  room_id?: number;
  id?: number;
  roomId?: number; // normalized id
  room_categories_name?: string;
  room_amenities?: string;
  images?: string | string[];
  room_name?: string;
  season_rate?: number;
  off_season_rates?: number;
  season_extra_bed?: number;
  extra_bed?: number;
  hotel_name?: string;
  hotel_id?: number;
  address?: string;
  hotel_cat_name?: string;
  city_id?: number;
  [key: string]: any;
};

interface CitySectionProps {
  city: any;
  cityId: number;
  selectedRooms: Selection[];
  onToggleRoom: (room: Room, options: { extraBed?: boolean }, checked: boolean) => void;
  travelDate: string;
  onHotelChange?: (hotelId: number, hotel?: any) => void;
}

export default function CitySection({
  city,
  cityId,
  selectedRooms,
  onToggleRoom,
  travelDate,
  onHotelChange,
}: CitySectionProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [hotelList, setHotelList] = useState<Room[]>([]);
  const [popupHotelList, setPopupHotelList] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (Array.isArray(city?.hotel)) {
      const normalizedRooms = city.hotel.map((r: any) => ({
        ...r,
        roomId: r.room_id ?? r.id,
        city_id: cityId,
      }));
      setHotelList(normalizedRooms);
    }
  }, [city?.hotel, cityId]);

  const isSeason = (date: string) => {
    if (!date) return false;
    const m = new Date(date).getMonth() + 1;
    return m >= 10 && m <= 12;
  };

  const fetchHotels = async ({ category = "" } = {}) => {
    try {
      let url = `/change-hotel?cityId=${cityId}`;
      if (category) url += `&hotelCategory=${encodeURIComponent(category)}`;
      const data = await apiRequest(url, "GET");
      setPopupHotelList(Array.isArray(data?.hotels) ? data.hotels : []);
      setFilters(data?.filters || {});
    } catch (err) {
      console.error("Error fetching hotels:", err);
    }
  };
  

 const handleSelectHotel = async (hotel: any) => {
  const newHotelId = hotel?.hotel_id ?? hotel?.id;
  const newHotelName = hotel.hotel_name;
  let newRooms: Room[] = [];

  if (Array.isArray(hotel?.rooms) && hotel.rooms.length > 0) {
    newRooms = hotel.rooms.map((r: any) => ({
      ...r,
      roomId: r.room_id ?? r.id,
      hotel_name: newHotelName,
      hotel_id: newHotelId,
      city_id: cityId,
    }));
  } else {
    try {
      const url = `/change-hotel?cityId=${cityId}&hotelId=${encodeURIComponent(
        String(newHotelId)
      )}`;
      const data = await apiRequest(url, "GET");
      const rooms: Room[] = data?.rooms || [];
      newRooms = rooms.map((r: any) => ({
        ...r,
        roomId: r.room_id ?? r.id,
        hotel_name: newHotelName,
        hotel_id: newHotelId,
        city_id: cityId,
      }));
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }

  setHotelList((prev) => {
    // 🔹 Remove old rooms from previous hotel
    const removedRooms = prev.filter(
      (r) => r.city_id === cityId && r.hotel_id !== newHotelId
    );

    removedRooms.forEach((r) => {
      const roomId = r.roomId ?? r.room_id ?? r.id;
      if (selectedRooms.find((sr) => sr.roomId === roomId)) {
        onToggleRoom(r, { extraBed: false }, false); // unselect old room
      }
    });

    const filtered = prev.filter(
      (r) => r.city_id !== cityId || r.hotel_id === newHotelId
    );
    const updated = [...filtered, ...newRooms];

    // 🔹 Auto-select first available room of new hotel
    // 🔹 Auto-select first available room of new hotel
// 🔹 Auto-select first available room of new hotel
  if (newRooms.length > 0) {
    const firstRoom = {
      ...newRooms[0],
      hotel_name: newHotelName,
      hotel_id: newHotelId,
      city_id: cityId,
    };

    // ✅ Pass correct city name so it's stored in the right bucket
    //onToggleRoom(firstRoom, { extraBed: false }, true);
  }


    return updated;
  });

  setSelectedCategory(hotel?.hotel_cat_name || "");
  setShowPopup(false);
  onHotelChange?.(newHotelId, hotel);
};

  // ✅ Group by hotel_id instead of hotel_name
  const hotelsGrouped = hotelList.reduce<Record<number, Room[]>>((acc, room) => {
    const id = room.hotel_id ?? 0;
    if (!acc[id]) acc[id] = [];
    acc[id].push(room);
    return acc;
  }, {});



  
  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white">
      <h2 className="text-lg font-bold flex justify-between items-center">
        {cityId} {city?.name} ({city?.nights} nights)
        <button
          onClick={() => {
            setShowPopup(true);
            fetchHotels();
          }}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Change Hotel
        </button>
      </h2>

      <div className="mt-4 space-y-6">
        {hotelList.length === 0 ? (
          <p>No hotels available for this city.</p>
        ) : (
          Object.entries(hotelsGrouped).map(([hotelId, rooms]) => {
            const hotelName = rooms[0]?.hotel_name || "Unknown Hotel";
            const address = rooms[0]?.address;
            return (
              <div key={hotelId}>
                <p className="text-base font-bold">{hotelName}</p>
                {address && <p className="text-sm text-gray-600 mb-3">{address}</p>}

                <div className="space-y-3">
                  {rooms.map((room) => {
                    const amenities = room.room_amenities
                      ? String(room.room_amenities).split(",").map((a) => a.trim())
                      : [];
                    const season = isSeason(travelDate);

                    const basePrice = season
                      ? room.season_rate ?? room.rate
                      : room.off_season_rates ?? room.rate;

                    const extraBedPrice = season
                      ? room.season_extra_bed ?? room.extra_bed
                      : room.extra_bed ?? 0;

                    // const selected = selectedRooms.find(
                    //   (r) => r.roomId === (room.roomId ?? room.room_id ?? room.id)
                    // );
                    const selected = selectedRooms.find(
                      (r) =>
                        r.roomId === (room.roomId ?? room.room_id ?? room.id) &&
                        room.city_id === cityId
                    );

                    const isSelected = !!selected;
                    // const withExtraBed = !!selected?.extraBed;
                    const withExtraBed = selected?.extraBed === true;


                    const roomImage = Array.isArray(room.images) ? room.images[0] : room.images;

                    return (
                      <div key={room.roomId} className="flex items-start border rounded p-3 space-x-4">
                        <div className="w-32 h-24 flex-shrink-0">
                          {roomImage ? (
                            <img
                              src={roomImage}
                              alt={room.room_categories_name ?? room.room_name ?? hotelName}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => onToggleRoom(room, { extraBed: false }, e.target.checked)}
                              />
                              <span className="font-semibold">{room.room_categories_name}</span>
                            </label>
                          </div>

                          <ul className="text-sm text-gray-600 mt-1 list-disc pl-5">
                            {amenities.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>

                          <p className="mt-2 text-sm font-medium">
                            Price: ₹{basePrice ?? "N/A"} {season ? "(Season)" : "(Off-season)"}
                          </p>

                          {isSelected && (
                            <label className="flex items-center space-x-2 mt-2">
                              <input
                                type="checkbox"
                                checked={withExtraBed}
                                onChange={(e) => onToggleRoom(room, { extraBed: e.target.checked }, true)}
                              />
                              <span className="text-sm">Extra Bed (+₹{extraBedPrice ?? 0})</span>
                            </label>
                          )}
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

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Select a Hotel in {city?.name}</h3>
              <button onClick={() => setShowPopup(false)} className="text-red-600 font-bold">
                ✕
              </button>
            </div>

            {filters?.categories?.length > 0 && (
              <div className="mb-4 flex space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    fetchHotels({ category: e.target.value });
                  }}
                  className="border px-2 py-1 rounded"
                >
                  <option value="">All Categories</option>
                  {filters.categories.map((cat: any, i: number) => (
                    <option key={i} value={cat.name ?? cat}>
                      {cat.name ?? cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              {popupHotelList.length === 0 && <p>No hotels found.</p>}
              {popupHotelList.map((hotel) => (
                <div
                  key={hotel.hotel_id ?? hotel.id}
                  className="border p-3 rounded shadow hover:shadow-md"
                >
                  <p className="font-bold">{hotel.hotel_name}</p>
                  {hotel.address && <p className="text-sm text-gray-600">{hotel.address}</p>}
                  {hotel.hotel_cat_name && <p className="text-xs text-gray-500">{hotel.hotel_cat_name}</p>}

                  <button
                    onClick={async () => {
                      await handleSelectHotel(hotel);
                    }}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Select This Hotel
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}