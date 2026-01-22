# API Keys Setup Instructions

## Quick Setup

1. **Create `.env.local` file** in the project root directory

2. **Add your API key** to the file:
   ```
   VITE_ZEUS_API_KEY=R4Z945q59HJbbg5BTjjK
   ```

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

## Available API Keys

If the first key doesn't work, try one of these others:

```
R4Z945q59HJbbg5BTjjK
T4TrV8V1ax31p7p1cnVL
AwODG44sVp7Pp0MW6MG7
7602FHQ0IU0ArWir5Rpw
4BInbZIq1N91ePs0UpWb
vNVeR5sFRKad3o0bdC4r
39rqr84dWZ0b2L0PwLCY
3fYgP7hhx7L9ZLmXa4qN
8VjV19go5zcWFXkfPhI1
YKSIw64GWHQfX42GIUQA
```

## Verify It's Working

1. Open browser DevTools (F12) → Console tab
2. Look for: `Zeus API Key Status: { keySet: true, ... }`
3. Click on a location on the globe
4. Check the footer - it should show `SOURCE: ZEUS_NODE` (green) instead of `SOURCE: ZEUS` (amber)

## Troubleshooting

- **Still showing "Not authenticated"**: Try a different API key from the list
- **Key not loading**: Make sure the file is named exactly `.env.local` (with the dot at the start)
- **Need to restart**: After changing `.env.local`, you must restart the dev server
