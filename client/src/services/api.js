const API_BASE = "/api";

export async function getListings(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const url = `${API_BASE}/listings${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to load marketplace listings.");
  }

  return response.json();
}

export async function chatWithLucie(messages) {
  const response = await fetch(`${API_BASE}/lucie/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Lucie is having trouble responding right now.");
  }

  return payload;
}

