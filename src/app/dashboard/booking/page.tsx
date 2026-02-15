"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Define a type for bookings
type Booking = {
  leavingFrom: string;
  travelers: number;
  date: string;
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const data: Booking[] = JSON.parse(localStorage.getItem("bookings") || "[]");
    setBookings(data);
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h2 className="text-xl font-bold mb-4">Previous Bookings</h2>
        <ul className="space-y-2">
          {bookings.length > 0 ? (
            bookings.map((b, i) => (
              <li key={i} className="p-3 bg-white shadow rounded">
                From: {b.leavingFrom}, Travelers: {b.travelers}, Date: {b.date}
              </li>
            ))
          ) : (
            <p>No bookings found.</p>
          )}
        </ul>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
