# Ngrok Auto-Detection Setup

## Automatic Ngrok URL Detection

The payment success page now automatically detects your ngrok URL using two methods:

### Method 1: Environment Variable (Recommended)
Add your ngrok URL to `.env.local`:

```env
NEXT_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

### Method 2: Ngrok API Auto-Detection
The system automatically queries ngrok's local API at `http://localhost:4040/api/tunnels` to find the HTTPS tunnel pointing to port 3000.

## How It Works

1. **Production**: Uses `window.location.origin` (normal behavior)
2. **Development on localhost**: 
   - First tries `NEXT_PUBLIC_NGROK_URL` environment variable
   - Falls back to ngrok API auto-detection
   - Finally uses localhost if neither works

## Setup Instructions

### Option A: Manual Environment Variable
1. Start your ngrok tunnel: `ngrok http 3000`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
3. Add to `.env.local`: `NEXT_PUBLIC_NGROK_URL=https://abc123.ngrok-free.app`
4. Restart your Next.js dev server

### Option B: Automatic Detection (No setup required)
1. Start ngrok: `ngrok http 3000`
2. Start Next.js: `npm run dev`
3. The system will automatically detect the ngrok URL

## Troubleshooting

- **Ngrok API not accessible**: Make sure ngrok is running and the web interface is available at `http://localhost:4040`
- **Wrong tunnel detected**: Use the environment variable method for more control
- **CORS issues**: The ngrok API call is made from the browser, so ensure ngrok's web interface is accessible

## Benefits

✅ No need to manually update URLs when ngrok restarts  
✅ Works automatically in development  
✅ Falls back gracefully to localhost  
✅ QR codes always point to the correct URL
