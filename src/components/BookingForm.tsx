"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api.js";
import { AutoComplete } from "primereact/autocomplete";

const NATIONALITIES = [
  "India",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "United Arab Emirates",
  "Singapore",
  "Germany",
  "France",
  "Other",
];

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type City = { id: number; city: string };
type DestinationRow = {
  id: string;
  cityInput: string;
  city?: City | null;
  nights: number;
  locked?: boolean;
  destSuggestions?: City[];
};

export default function BookingForm() {
  const router = useRouter();

useEffect(() => {
  apiRequest("/categories")
    .then(res => {
      if (res.success === false) {
        router.push("https://agent.yoginee.com/");
        return;
      }
      setCategories(res.categories || res.data || fallbackCategories);
    })
    .catch(() => setCategories(fallbackCategories));
}, [router]);



  const [rows, setRows] = useState<DestinationRow[]>([
    { id: crypto.randomUUID(), cityInput: "", nights: 2, locked: true }
  ]);

  const [leaveSuggestions, setLeaveSuggestions] = useState<City[]>([]);
  const [leavingFrom, setLeavingFrom] = useState<string>("");
  const [leavingFromSel, setLeavingFromSel] = useState<City | null>(null);

  const [nationality, setNationality] = useState<string>("India");
  const [leavingOn, setLeavingOn] = useState<string>("");
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [starCategory, setStarCategory] = useState<string>("");
  const [addTransfers, setAddTransfers] = useState<boolean>(true);
  const [landOnly, setLandOnly] = useState<boolean>(false);

  const [seatingCapacity, setSeatingCapacity] = useState<number>(4); // seats per vehicle
  const [selectedTransport, setSelectedTransport] = useState<number>(1);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string>("");

  const fallbackCategories = [
    { id: 1, name: "5 Star" },
    { id: 2, name: "4 Star" },
    { id: 3, name: "3 Star" }
  ];

  useEffect(() => {
    apiRequest("/categories")
      .then(res => setCategories(res.categories || res.data || fallbackCategories))
      .catch(() => setCategories(fallbackCategories));
  }, []);

  const debouncedLeaving = useDebounce(leavingFrom);

  useEffect(() => {
    if (!debouncedLeaving.trim()) return setLeaveSuggestions([]);
    apiRequest(`/cities?search=${encodeURIComponent(debouncedLeaving)}`)
      .then(res => setLeaveSuggestions(res.cities || []))
      .catch(() => setLeaveSuggestions([]));
  }, [debouncedLeaving]);

  const addRow = () => setRows(prev => ([...prev, { id: crypto.randomUUID(), cityInput: "", nights: 1 }]));
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id: string, patch: Partial<DestinationRow>) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const validate = () => {
    if (!rows.length) return "Please add at least one destination.";
    for (const r of rows) {
      if (!r.cityInput?.trim()) return "Please select a city for each destination.";
      if (!r.nights) return "Please select nights for each destination.";
    }
    if (!leavingFrom?.trim()) return "Please select 'Leaving From' city.";
    if (!leavingOn) return "Please choose a leaving date.";
    if (!landOnly) {
      if (!starCategory) return "Please choose a star rating.";
      if (!roomsCount) return "Please select number of rooms.";
    }
    return null;
  };

  // --- Calculations ---
const totalTravellers =
  Number(adults || 0) + childAges.filter(age => Number(age) > 6).length;

// Rooms: ceil(travellers / 2)
const minRooms = Math.ceil(totalTravellers / 2);
useEffect(() => {
  if (roomsCount < minRooms) setRoomsCount(minRooms);
}, [totalTravellers]);

// Vehicles: ceil(travellers / seatingCapacity)
const safeCapacity = Number(seatingCapacity) > 0 ? Number(seatingCapacity) : 1;
const minVehicles =
  safeCapacity > 0 ? Math.ceil(totalTravellers / safeCapacity) : 1;

useEffect(() => {
  if (selectedTransport < minVehicles) setSelectedTransport(minVehicles);
}, [totalTravellers, safeCapacity]);

// --- Submit ---
const onSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const err = validate();
  if (err) {
    setError(err);
    console.warn("Validation failed:", err);
    return;
  }

  const payload = {
    destinations: rows.map(r => ({
      id: r.city?.id || null,
      city: r.city?.city || r.cityInput,
      nights: r.nights
    })),
    leavingFrom: leavingFromSel?.city || leavingFrom,
    leavingFromId: leavingFromSel?.id || null,
    nationality,
    leavingOn,
    travellers: totalTravellers || 0,
    children: childrenCount || 0,
    childAges: childAges.map(a => Number(a) || 0),
    rooms: roomsCount || 1,
    starCategory,
    addTransfers,
    landOnly,
    transportVehicles: Number(selectedTransport) || 1,
    seatsPerVehicle: safeCapacity
  };

  console.log("Submitting payload:", payload);

  sessionStorage.setItem("bookingForm", JSON.stringify(payload));
  router.push("/dashboard/booking/details");
};


  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex items-start justify-center bg-cover bg-center p-4" style={{ backgroundImage: "url('/bg.jpg')" }}>
      <form onSubmit={onSubmit} className="mt-6 bg-white/65 backdrop-blur shadow-lg rounded-2xl p-6 w-full max-w-2xl">
        <h1 className="text-xl font-semibold mb-4 text-black">Create Customized Proposal</h1>

        {/* DESTINATIONS */}
        <section className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Enter the cities below in the order they will be visited:</p>
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                <AutoComplete
                  value={row.city || null}
                  suggestions={row.destSuggestions || []}
                  completeMethod={async e => {
                    const query = e.query.trim();
                    if (!query) return;
                    try {
                      const res = await apiRequest(`/cities?search=${encodeURIComponent(query)}`);
                      updateRow(row.id, { destSuggestions: res.cities || [] });
                    } catch { updateRow(row.id, { destSuggestions: [] }); }
                  }}
                  field="city"
                  placeholder="Select City"
                  forceSelection
                  onChange={e => updateRow(row.id, { city: e.value, cityInput: e.value?.city || "" })}
                  className="w-full custom-autocomplete"
                />
                <select
                  className="border rounded-lg px-3 py-2 text-black"
                  value={row.nights}
                  onChange={e => updateRow(row.id, { nights: Number(e.target.value) })}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} night{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`p-2 rounded-lg border text-red-600 hover:bg-red-50 ${row.locked ? "opacity-40 pointer-events-none" : ""}`}
                  onClick={() => removeRow(row.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="text-blue-600 text-sm mt-2">+ Add Another City</button>
        </section>

        {/* TRIP DETAILS */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Leaving From</label>
              <AutoComplete
                value={leavingFromSel}
                suggestions={leaveSuggestions}
                completeMethod={async e => {
                  const query = e.query.trim();
                  if (!query) return;
                  try { const res = await apiRequest(`/cities?search=${encodeURIComponent(query)}`); setLeaveSuggestions(res.cities || []); }
                  catch { setLeaveSuggestions([]); }
                }}
                field="city"
                placeholder="Start city"
                className="w-full custom-autocomplete"
                forceSelection
                onChange={e => { setLeavingFromSel(e.value); setLeavingFrom(e.value?.city || ""); }}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Nationality*</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-black"
                value={nationality}
                onChange={e => setNationality(e.target.value)}
              >
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Leaving on*</label>
              <input
                type="date"
                min={minDate}
                className="w-full border rounded-lg px-3 py-2 text-black"
                value={leavingOn}
                onChange={e => setLeavingOn(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Number of Adults*</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-black"
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n > 1 ? "adults" : "adult"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Number of Children</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-black"
                value={childrenCount}
                onChange={e => {
                  const count = Number(e.target.value);
                  setChildrenCount(count);
                  setChildAges(prev => { const newAges = [...prev]; newAges.length = count; return newAges; });
                }}
              >
                {Array.from({ length: 30 }, (_, i) => i).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {childrenCount > 0 && (
              <div>
                <label className="block text-gray-700 mb-1">Children Ages</label>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: childrenCount }).map((_, idx) => (
                    <input
                      key={idx}
                      type="number"
                      min={0}
                      placeholder={`Age ${idx + 1}`}
                      value={childAges[idx] || ""}
                      onChange={e => {
                        const ages = [...childAges];
                        ages[idx] = Number(e.target.value) || 0;
                        setChildAges(ages);
                      }}
                      className="border rounded px-2 py-1 text-black"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {!landOnly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Number of Rooms (Min: {minRooms})</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={roomsCount}
                  onChange={e => setRoomsCount(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n > 1 ? "rooms" : "room"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Star rating</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={starCategory}
                  onChange={e => setStarCategory(e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {addTransfers && (
           
               <div>
                <input
                  type="hidden"
                  min={1}
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={seatingCapacity}
                  onChange={e => setSeatingCapacity(Number(e.target.value) || 1)}
                />
                
                <input
                  type="hidden"
                  min={1}
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={selectedTransport}
                  onChange={e => setSelectedTransport(Number(e.target.value) || 1)}
                />
           </div>
          )}

          <div className="flex items-center gap-6 pt-1">
  <label className="inline-flex items-center gap-2">
    <input
      type="radio"
      name="transferOption"
      checked={addTransfers}
      onChange={() => {
        setAddTransfers(true);
        setLandOnly(false);
      }}
    />
    <span className="text-black">Add Transfers</span>
  </label>

  <label className="inline-flex items-center gap-2">
    <input
      type="radio"
      name="transferOption"
      checked={landOnly}
      onChange={() => {
        setLandOnly(true);
        setAddTransfers(false);
      }}
    />
    <span className="text-black">Land Only (no stay required)</span>
  </label>
</div>

        </section>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="mt-6">
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
