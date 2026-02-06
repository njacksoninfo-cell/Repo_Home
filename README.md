# PawSwipe - Dog Adoption Swiper

Swipe through adoptable dogs near you and save your favorites. Like Tinder, but for finding your new best friend.

## Features

- Swipe right to like, left to pass (touch + mouse + buttons)
- Browse real adoptable dogs from shelters near your zip code
- Save favorites and view their shelter profiles
- Auto-loads more dogs as you swipe
- Mobile-first responsive design
- Demo mode to try without an API key

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Using Real Data

PawSwipe uses the free [RescueGroups.org API](https://rescuegroups.org/services/adoptable-pet-data-api/) to fetch real adoptable dogs from shelters near you.

1. Visit https://rescuegroups.org/services/adoptable-pet-data-api/
2. Click "Request API Access" and fill out the form (it's free)
3. Enter your API key and zip code in the app

You can also click **Try Demo Mode** to preview the app with sample data.

## Tech Stack

- React 19 + TypeScript
- Vite
- RescueGroups.org API v5
- CSS (no framework)
