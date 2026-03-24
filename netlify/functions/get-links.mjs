import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const password = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!password || auth !== password) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const store = getStore("links");
    const { blobs } = await store.list();

    const links = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: "json" });
        return {
          id: blob.key,
          destination: data.destination,
          name: data.name,
          createdAt: data.createdAt,
          visitCount: data.visits?.length || 0,
        };
      })
    );

    links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return new Response(JSON.stringify(links), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/get-links",
};
