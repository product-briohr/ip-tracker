# IP Tracker

Track clicks on shared links with deep device fingerprinting. When someone clicks your tracking link, the system collects 50+ data points and redirects them to the real destination (e.g., Google Maps).

## Data Collected

**Server-side (from IP):** Country, city, region, coordinates, ISP, organization, AS, reverse DNS, mobile/proxy/hosting detection

**Client-side (from browser):** User agent, platform, language, CPU cores, RAM, screen resolution, viewport, GPU info (vendor/model via WebGL), canvas fingerprint, audio fingerprint, battery status, connection type/speed, timezone, geolocation (GPS if permitted), local IPs via WebRTC, media devices, browser permissions, dark mode preference, installed features, storage quota, JS heap size, touch support, and more.

**VPN Detection:** Compares IP timezone vs browser timezone, IP country vs browser locale, and checks proxy/hosting flags.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Deploy to Netlify

**Option A: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Option B: Git-based deploy**
1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import existing project"
3. Select your repo
4. Build settings are auto-detected from `netlify.toml`

### 3. Set environment variable

In Netlify dashboard → Site settings → Environment variables:

- **`ADMIN_PASSWORD`** — your dashboard login password (required)

### 4. Use it

1. Go to `https://your-site.netlify.app` → login with your password
2. Paste a Google Maps URL (or any URL) → click Create
3. Copy the tracking link (`https://your-site.netlify.app/r/abc123`)
4. Share it — when clicked, device data is captured and the user is redirected to the real URL
5. View all collected data in the dashboard

## Architecture

- **Frontend:** Static HTML/CSS/JS (no framework)
- **Backend:** Netlify Functions v2 (serverless)
- **Storage:** Netlify Blobs (built-in key-value store, zero config)
- **IP Geolocation:** ip-api.com (free, no API key needed)
- **Maps:** Leaflet.js with CARTO dark tiles

## Local Development

```bash
npm install -g netlify-cli
netlify dev
```

This starts a local dev server with function emulation and Blobs support.

## Project Structure

```
├── netlify/functions/
│   ├── track.mjs          # Records visit + returns redirect URL (public)
│   ├── create-link.mjs    # Creates tracking link (auth required)
│   ├── get-links.mjs      # Lists all links (auth required)
│   ├── get-visits.mjs     # Gets visits for a link (auth required)
│   └── delete-link.mjs    # Deletes a link (auth required)
├── public/
│   ├── index.html          # Dashboard SPA
│   └── collect.html        # Fingerprint collector + redirect page
├── netlify.toml
└── package.json
```

## Tips

- Name your Netlify site something inconspicuous like `map-share` or `location-view`
- The tracking page mimics a Google Maps redirect, making the geolocation permission prompt seem natural
- Green map pins = GPS-precise location (user granted geolocation), Purple = IP-based estimate
- Export visit data as JSON from the detail view for further analysis
