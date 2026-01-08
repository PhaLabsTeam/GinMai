# GinMai

**กินไหม** — "Wanna eat?"

Share a meal with someone nearby. That's it.

---

## What is this?

GinMai is a mobile app that solves one problem: eating alone when you don't want to.

You open the app. You see who's eating nearby. You join them—or share your own meal. You meet. You eat. The app disappears.

Not dating. Not networking. Just meals.

---

## Status

🚧 **In Development** — Building toward TestFlight launch in Chiang Mai, Thailand.

Current milestone: **M1 — The First Moment**

---

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Start here. Project overview and current focus. |
| [docs/product-philosophy.md](./docs/product-philosophy.md) | The soul of GinMai. Why we build what we build. |
| [docs/user-flow.md](./docs/user-flow.md) | Every screen, every state, every edge case. |
| [docs/architecture.md](./docs/architecture.md) | Technical architecture and system design. |
| [docs/milestones.md](./docs/milestones.md) | Roadmap with acceptance criteria. |
| [docs/decisions.md](./docs/decisions.md) | Why we made each technical choice. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo (React Native) |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Maps | react-native-maps + Google Places |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- iOS Simulator or Android Emulator (or physical device)

### Setup

```bash
# Clone the repo
git clone https://github.com/[your-username]/ginmai.git
cd ginmai

# Install dependencies
cd app
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development
npx expo start
```

### Supabase Setup

```bash
# Navigate to supabase folder
cd supabase

# Start local Supabase (Docker required)
supabase start

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > ../app/src/types/database.ts
```

---

## Project Structure

```
ginmai/
├── CLAUDE.md                 ← AI assistant context
├── README.md                 ← You are here
├── docs/                     ← Documentation
│   ├── product-philosophy.md
│   ├── user-flow.md
│   ├── architecture.md
│   ├── milestones.md
│   └── decisions.md
├── app/                      ← Expo app (created separately)
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── ...
└── supabase/                 ← Database config
    ├── migrations/
    └── seed.sql
```

---

## Contributing

This is currently a solo/small team project. If you're interested in contributing, reach out first.

---

## Philosophy

> "An empty map should feel like a calm lake, not an empty room."

> "You're not hosting. You're just open."

> "The app is a door, not a room."

---

## License

TBD

---

*Built with 💛 in Chiang Mai*
