# Zeus API Setup

## Why is the source showing as "SIMULATION"?

The app falls back to simulation data when the Zeus API calls fail. Common reasons:

1. **API Key not set** - The default key `example123` may not be valid
2. **Network/CORS issues** - Browser blocking the API calls
3. **API endpoint errors** - Check browser console for specific error messages

## How to Set Up Zeus API Key

1. **Create `.env.local` file** in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and replace `example123` with your actual API key:
   ```bash
   VITE_ZEUS_API_KEY=your_actual_api_key_here
   ```

3. **Get your API key** from the Zeus Subnet hackathon:
   - Visit: https://www.zeussubnet.com/hackathon
   - The documentation shows `example123` as an example, but you need your actual hackathon API key
   - If you don't have one, contact the hackathon organizers

4. **Restart the dev server** after adding the key:
   ```bash
   npm run dev
   ```

5. **Verify the key is loaded**: Check the browser console - you should see:
   ```
   Zeus API Key Status: { keySet: true, keyPreview: "your...", keyLength: X }
   ```

## Debugging API Issues

The app now logs detailed error information to the browser console. To debug:

1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for messages starting with:
   - "Fetching from Zeus API:" - Shows what's being requested
   - "Zeus API Error:" - Shows specific error details
   - "Zeus API call failed" - Shows why it fell back to simulation

## API Endpoint

- **Endpoint**: `https://api.zeussubnet.com/forecast`
- **Authentication**: Bearer token in `Authorization` header
- **Documentation**: https://www.zeussubnet.com/hackathon

## Current Configuration

- API Key: Check `.env.local` file or use default `example123`
- Timeout: 10 seconds per request
- Variables fetched: temperature, wind (u/v), precipitation, pressure, dewpoint
