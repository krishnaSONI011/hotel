"use client";
import AuthTabs from "@/components/AuthTabs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const router = useRouter();

  // If already logged in, go to dashboard
  useEffect(() => {
    if (localStorage.getItem("user")) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <AuthTabs onAuthSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
