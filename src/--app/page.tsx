"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api.js";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    password: ""
  });
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  // ✅ Separate handlers for login vs register
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (activeTab === "login") {
      setLoginFormData({ ...loginFormData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Processing...");

    const path = activeTab === "login" ? "/login" : "/register";
    const payload = activeTab === "login" ? loginFormData : formData;

    try {
      const data = await apiRequest(path, "POST", payload);

      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("id", data.id);
      }

      setMessage(
        data.message || (activeTab === "login" ? "Login successful" : "Registration successful")
      );

      // ✅ redirect only after success
      if (data?.token) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 bg-[url('/bg.jpg')]">
      <div className=" mt-6 bg-white/65 backdrop-blur shadow-lg rounded-2xl p-6 w-full max-w-md">
        {/* Tabs */}
        <div className="flex justify-around border-b mb-4">
          <button
            type="button"
            className={`py-2 px-4 font-medium ${activeTab === "login" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`py-2 px-4 font-medium ${activeTab === "register" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "register" && (
            <>
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone number"
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10} // restricts to 10 characters
                  pattern="[0-9]{10}" // ensures only 10 digits
                  inputMode="numeric" // mobile devices will show number keypad
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  className="w-full border rounded-lg px-3 py-2 text-black"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className="w-full border rounded-lg px-3 py-2 text-black"
              value={activeTab === "login" ? loginFormData.email : formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="w-full border rounded-lg px-3 py-2 text-black"
              value={activeTab === "login" ? loginFormData.password : formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {activeTab === "login" ? "Login" : "Register"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
