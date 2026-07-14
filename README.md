# Testy Networks — Billing System

Full-stack ISP billing console: React/Vite frontend + Express backend with real
MikroTik RouterOS API and Safaricom Daraja M-Pesa STK Push integration.

## Structure
```
backend/     Express API — MikroTik + M-Pesa + billing routes
frontend/    React/Vite dashboard — luxury dark theme
```

## Setup

### Backend
```
cd backend
npm install
cp config/.env.example .env
# edit .env with your router IP/credentials and Daraja keys
npm start
```
Runs on http://localhost:4000

### Frontend
```
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173. Create a `.env` with
`VITE_API_BASE_URL=http://localhost:4000/api` if your backend isn't on the default port.

Default login: whatever you set as `ADMIN_USERNAME` / `ADMIN_PASSWORD` in backend/.env.

## Before going live

1. **MikroTik**: enable the API service on your router (`/ip service enable api`, port 8728,
   or `api-ssl` on 8729 for TLS). Point `MIKROTIK_HOST` at your router's LAN IP.
2. **Daraja**: register an app at developer.safaricom.co.ke, get your consumer key/secret,
   shortcode, and passkey. Set `MPESA_CALLBACK_URL` to a **publicly reachable** HTTPS URL
   (Safaricom's servers must be able to POST to it) — e.g. your deployed backend's
   `/api/mpesa/callback` endpoint. This won't work on localhost; use ngrok for local testing
   or deploy the backend first.
3. Switch `MPESA_ENV` to `production` and use your production shortcode/passkey once
   you're off the Daraja sandbox.
4. Change `ADMIN_PASSWORD` and `JWT_SECRET` to real values — don't ship the example ones.

## How the payment flow works

1. Admin picks a package + enters customer phone in the Billing tab → sends STK push.
2. Customer gets the M-Pesa prompt on their phone and enters their PIN.
3. Safaricom POSTs the result to `/api/mpesa/callback`.
4. On success, the backend automatically creates a time-limited hotspot user on the
   router (via `/ip/hotspot/user/add` with `limit-uptime` matching the package) and
   marks the transaction confirmed.
5. Customer logs into the hotspot with their phone number as username/password.
