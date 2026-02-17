export async function apiRequest(path, method = "GET", body) {
  try {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://agent.yoginee.com/travel/api";
    const url = `${baseURL}${path}`;

    console.log("🚀 API Request Called:");
    console.log("➡️ URL:", url);
    console.log("➡️ Method:", method);
    console.log("➡️ Body:", body);

    const token = localStorage.getItem("token");
    console.log("➡️ token:", token);
    const headers = {
      "Content-Type": "application/json",
    };

    // Add Authorization header only if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // if (!res.ok) {
    //   console.error("❌ API Error:", res.status, res.statusText);
    //   throw new Error(`API request failed: ${res.status}`);
    // }
    if (res.success === false) {
          console.warn("⚠️ Unauthorized or invalid session");
          localStorage.removeItem("token");
          sessionStorage.clear();
          router.replace("/"); // Redirect to login
          return;
        }

        // Authorized → render page
       // setLoading(false);

    const data = await res.json();
    console.log("✅ API Response:", data);

    return data;
  } catch (err) {
    console.error("🔥 apiRequest failed:", err);
    throw err;
  }
}
