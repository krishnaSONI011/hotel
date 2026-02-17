import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api.js";

type Selection = {
  roomId: number;
  extraBed?: boolean;
};

type SightseeingSelection = {
  id: number;
  cityId: number;
  name: string;
  details?: string;
  price?: number;
  cityName?: string;
};

type Room = {
  room_id?: number;
  id?: number;
  roomId?: number;
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
  cityName?: string;
  rate?: number;
  [key: string]: any;
};

interface CitySectionProps {
  city: any;
  cityId: number;
  selectedRooms: Selection[];
  onToggleRoom: (room: Room, options: { extraBed?: boolean }, checked: boolean) => void;
  travelDate: string;
  onHotelChange?: (hotelId: number, hotel: any) => void;

  // ✅ NEW
  selectedSightseeing: SightseeingSelection[];
  onToggleSightseeing: (sight: SightseeingSelection, checked: boolean) => void;
}

export default function CitySection({
  city,
  cityId,
  selectedRooms,
  onToggleRoom,
  travelDate,
  onHotelChange,

  // ✅ NEW
  selectedSightseeing,
  onToggleSightseeing,
}: CitySectionProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [hotelList, setHotelList] = useState<Room[]>([]);
  const [popupHotelList, setPopupHotelList] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // ✅ NEW: sightseeing popup
  const [showSightPopup, setShowSightPopup] = useState(false);
  const [sightList, setSightList] = useState<any[]>([]);
  const [loadingSight, setLoadingSight] = useState(false);

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

  // ✅ NEW: fetch sightseeing
  const fetchSightseeing = async () => {
    try {
      setLoadingSight(true);
      setSightList([]);

      // 🔥 Call live sightseeing API (proxied via NEXT_PUBLIC_API_URL)
      // Backend endpoint: /api/site-seeing?cityId=...
      const url = `/site-seeing?cityId=${cityId}`;
      const data = await apiRequest(url, "GET");

      // Live API shape: { success, total, data: [...] }
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.sightseeing)
        ? data.sightseeing
        : [];

      setSightList(list);
    } catch (err) {
      console.error("Error fetching sightseeing:", err);
    } finally {
      setLoadingSight(false);
    }
  };

  const handleSelectHotel = async (hotel: any) => {
    const newHotelId = hotel?.hotel_id ?? hotel?.id;
    const newHotelName = hotel?.hotel_name;
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

    const currentHotelId = hotelList.find((r) => r.city_id === cityId)?.hotel_id ?? null;
    if (currentHotelId && currentHotelId !== newHotelId) {
      hotelList
        .filter((r) => r.city_id === cityId && r.hotel_id === currentHotelId)
        .forEach((r) => {
          const roomId = r.roomId ?? r.room_id ?? r.id;
          if (selectedRooms.some((sr) => sr.roomId === roomId)) {
            onToggleRoom({ ...r, cityName: city?.name }, { extraBed: false }, false);
          }
        });
    }

    setHotelList((prev) => {
      const filtered = prev.filter((r) => r.city_id !== cityId);
      return [...filtered, ...newRooms];
    });

    setSelectedCategory(hotel?.hotel_cat_name || "");
    setShowPopup(false);

    // Send normalized hotel payload so parent summary uses latest rooms/rates.
    onHotelChange?.(newHotelId, {
      ...hotel,
      hotel_id: newHotelId,
      hotel_name: newHotelName,
      rooms: newRooms,
    });
  };
  // auto select first room if none selected
  // useEffect(() => {
  //   if (!hotelList || hotelList.length === 0) return;

  //   const alreadySelected = selectedRooms.some((sr) =>
  //     hotelList.some((room) => (room.roomId ?? room.
  //     room_id ?? room.id) === sr.roomId)
  //   );

  //   if (alreadySelected) return;

  //   const firstRoom = hotelList[0];

  //   onToggleRoom(
  //     { ...firstRoom, city_id: cityId, cityName: city?.
  //     name },
  //     { extraBed: false },
  //     true
  //   );
  // }, [hotelList, cityId, selectedRooms]);
  const hotelsGrouped = hotelList.reduce<Record<number, Room[]>>((acc, room) => {
    const id = room.hotel_id ?? 0;
    if (!acc[id]) acc[id] = [];
    acc[id].push(room);
    return acc;
  }, {});

  // ✅ Selected sightseeing of this city
  const selectedCitySightseeing = selectedSightseeing.filter((s) => s.cityId === cityId);

  return (
    <div className="p-4 border text-black rounded-lg shadow bg-white">
      <h2 className="text-lg font-bold flex justify-between items-center">
        <span>
          {cityId} {city?.name} ({city?.nights} nights)
        </span>

        <div className="flex gap-2">
          {/* CHANGE HOTEL */}
          <button
            onClick={() => {
              setShowPopup(true);
              fetchHotels();
            }}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Change Hotel
          </button>

          {/* ✅ NEW: SIGHTSEEING BUTTON */}
          <button
            onClick={() => {
              setShowSightPopup(true);
              fetchSightseeing();
            }}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            Sight Seeing
          </button>
        </div>
      </h2>

      {/* ✅ SHOW SELECTED SIGHTSEEING BELOW HEADER */}
      {selectedCitySightseeing.length > 0 && (
        <div className="mt-4 border rounded p-3 bg-gray-50">
          <p className="font-bold mb-2">Selected Sightseeing</p>

          <div className="space-y-2">
            {selectedCitySightseeing.map((s) => (
              <div key={s.id} className="flex justify-between items-start border-b pb-2">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  {s.details && <p className="text-sm text-gray-600">{s.details}</p>}
                </div>

                <div className="text-right">
                  <p className="font-medium">₹{s.price ?? 0}</p>
                  <button
                    onClick={() => onToggleSightseeing(s, false)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

                    const roomId = room.roomId ?? room.room_id ?? room.id;

                    const selected = selectedRooms.find((r) => r.roomId === roomId);
                    const isSelected = !!selected;
                    const withExtraBed = !!selected?.extraBed;

                    const roomImage = Array.isArray(room.images) ? room.images[0] : room.images;

                    return (
                      <div key={roomId} className="flex items-start border rounded p-3 space-x-4">
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
                                onChange={(e) =>
                                  onToggleRoom(
                                    { ...room, cityName: city?.name },
                                    { extraBed: false },
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="font-semibold">
                                {room.room_categories_name ?? room.room_name}
                              </span>
                            </label>
                          </div>

                          <ul className="text-sm text-gray-600 mt-1 list-disc pl-5">
                            {amenities.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>

                          <p className="mt-2 text-sm font-medium">
                            Price: ₹{basePrice ?? "N/A"}{" "}
                            {season ? "(Season)" : "(Off-season)"}
                          </p>

                          {isSelected && (
                            <label className="flex items-center space-x-2 mt-2">
                              <input
                                type="checkbox"
                                checked={withExtraBed}
                                onChange={(e) =>
                                  onToggleRoom(
                                    { ...room, cityName: city?.name },
                                    { extraBed: e.target.checked },
                                    true
                                  )
                                }
                              />
                              <span className="text-sm">
                                Extra Bed (+₹{extraBedPrice ?? 0})
                              </span>
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

      {/* HOTEL POPUP */}
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
                  {hotel.hotel_cat_name && (
                    <p className="text-xs text-gray-500">{hotel.hotel_cat_name}</p>
                  )}

                  <button
                    onClick={async () => await handleSelectHotel(hotel)}
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

      {/* ✅ SIGHTSEEING POPUP */}
      {showSightPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sightseeing in {city?.name}</h3>
              <button onClick={() => setShowSightPopup(false)} className="text-red-600 font-bold">
                ✕
              </button>
            </div>

            {loadingSight && <p>Loading sightseeing...</p>}

            {!loadingSight && sightList.length === 0 && <p>No sightseeing found.</p>}

            <div className="space-y-4">
              {sightList.map((sight) => {
                const sightId = sight?.id ?? sight?.sight_id;
                const name = sight?.name ?? sight?.title ?? "Sightseeing";
                const details =
                  sight?.sightseeing_details ??
                  sight?.details ??
                  sight?.description ??
                  "";
                const price = Number(sight?.price ?? sight?.rate ?? 0);

                const checked = selectedSightseeing.some(
                  (x) => x.id === sightId && x.cityId === cityId
                );

                const payload: SightseeingSelection = {
                  id: sightId,
                  cityId,
                  name,
                  details,
                  price,
                  cityName: city?.name,
                };

                return (
                  <div key={sightId} className="border p-3 rounded shadow hover:shadow-md">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-bold">{name}</p>
                        {details && <p className="text-sm text-gray-600">{details}</p>}
                        {price > 0 && (
                          <p className="text-sm font-medium mt-1">₹{price}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSightseeing(payload, !checked)}
                        className={`px-3 py-1 text-sm rounded ${
                          checked
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {checked ? "Remove" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
