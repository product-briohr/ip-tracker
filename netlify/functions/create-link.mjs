import { getStore } from "@netlify/blobs";

function generateId(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const password = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!password || auth !== password) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { destination, name } = await req.json();
    if (!destination) {
      return new Response(JSON.stringify({ error: "Missing destination URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = generateId();
    const store = getStore("links");

    const linkData = {
      destination,
      name: name || "Untitled",
      createdAt: new Date().toISOString(),
      visits: [],
    };

    await store.setJSON(id, linkData);

    const baseUrl = new URL(req.url).origin;
    return new Response(
      JSON.stringify({
        id,
        trackingUrl: `${baseUrl}/r/${id}`,
        ...linkData,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/create-link",
};
