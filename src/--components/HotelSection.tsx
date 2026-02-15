export interface Hotel {
  hotel_id: number;
  hotel_name: string;
  address: string;
  room_id: number;
  room: string;
  room_amenities: string;
  images: string | null;
  off_season_rates?: number;
  season_rate?: number;
  [key: string]: any;
}

interface HotelSectionProps {
  hotels: Hotel[]; // pass array of hotels for the same city
}

export default function HotelSection({ hotels }: HotelSectionProps) {
  if (hotels.length === 0) return null;

  // Extract hotel-level info from the first room
  const { hotel_name, address } = hotels[0];

  return (
    <div className="p-4 border rounded-lg bg-white shadow space-y-4">
      <h2 className="text-lg font-semibold">{hotel_name}</h2>
      <p className="text-sm text-gray-600">{address}</p>

      {/* Rooms Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Select</th>
            <th className="border p-2 text-left">Room</th>
            <th className="border p-2 text-left">Amenities</th>
            <th className="border p-2 text-left">Price (Off-season)</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((room) => {
            const amenitiesArray = room.room_amenities
              ? room.room_amenities.split(",").map((a) => a.trim())
              : [];

            return (
              <tr key={room.room_id}>
                <td className="border p-2">
                  <input type="radio" name={`hotel-${room.hotel_id}`} value={room.room_id} />
                </td>
                <td className="border p-2">{room.room}</td>
                <td className="border p-2">
                  <ul className="list-disc pl-4 text-sm">
                    {amenitiesArray.map((amenity, i) => (
                      <li key={i}>{amenity}</li>
                    ))}
                  </ul>
                </td>
                <td className="border p-2">₹{room.off_season_rates}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
