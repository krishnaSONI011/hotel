"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api.js";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCategories = async () => {
      try {
        const res = await apiRequest("/categories");
        if (res.success === false) {
          localStorage.removeItem("token");
          sessionStorage.clear();

          // API says user is unauthorized → redirect
          router.replace("/"); // redirect to login page
        } else {
          // Authorized → allow page to render
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        router.replace("/"); // redirect on API error
      }
    };

    checkCategories();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
