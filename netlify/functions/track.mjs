import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { id, deviceInfo } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing link ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = getStore("links");
    const linkData = await store.get(id, { type: "json" });

    if (!linkData) {
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("client-ip") ||
      context.ip ||
      "unknown";

    let geo = {};
    try {
      const geoRes = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`
      );
      const geoData = await geoRes.json();
      if (geoData.status === "success") {
        geo = geoData;
      }
    } catch {}

    const headers = {};
    for (const [key, value] of req.headers.entries()) {
      if (!key.startsWith("x-nf-") && key !== "authorization") {
        headers[key] = value;
      }
    }

    const visit = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ip,
      geo,
      device: deviceInfo || {},
      headers,
      netlifyGeo: context.geo || {},
    };

    const vpnIndicators = [];
    if (deviceInfo?.timezone && geo.timezone && deviceInfo.timezone !== geo.timezone) {
      vpnIndicators.push("timezone_mismatch");
    }
    if (deviceInfo?.language && geo.countryCode) {
      const langCountry = deviceInfo.language.split("-")[1]?.toUpperCase();
      if (langCountry && langCountry !== geo.countryCode) {
        vpnIndicators.push("language_mismatch");
      }
    }
    if (geo.proxy) vpnIndicators.push("proxy_detected");
    if (geo.hosting) vpnIndicators.push("hosting_ip");
    visit.vpnIndicators = vpnIndicators;

    if (!linkData.visits) linkData.visits = [];
    linkData.visits.push(visit);

    await store.setJSON(id, linkData);

    return new Response(JSON.stringify({ destination: linkData.destination }), {
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
  path: "/api/track",
};
