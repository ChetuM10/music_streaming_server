# 🎵 Melodify - Music Streaming Server

Backend API server for the Melodify music streaming application, built with Node.js, Express, and Supabase.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## ✨ Features

- 🔐 **JWT Authentication** - Secure routes with Supabase JWT verification
- 🎵 **Tracks API** - CRUD operations for music tracks
- 🎙️ **Podcasts API** - Manage podcasts and episodes
- 📋 **Playlists API** - Create and manage user playlists
- ❤️ **Favorites API** - Like/unlike tracks
- 🕐 **History API** - Track listening history
- 🔍 **Search API** - Search across tracks and podcasts
- 📤 **Upload API** - Handle file uploads with Multer
- 👑 **Admin Middleware** - Protected admin-only routes

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **File Uploads**: Multer
- **Environment**: dotenv-x

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with tables created (run `supabase_schema.sql`)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ChetuM10/music_streaming_server.git
   cd music_streaming_server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file:

   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Server
   PORT=5000
   NODE_ENV=development

   # CORS
   CLIENT_URL=http://localhost:5173
   ```

4. **Set up the database**

   Run `supabase_schema.sql` in your Supabase SQL Editor to create all tables.

5. **Start the server**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

| Method | Endpoint             | Description            | Auth     |
| ------ | -------------------- | ---------------------- | -------- |
| POST   | `/api/auth/signup`   | Register new user      | ❌       |
| POST   | `/api/auth/login`    | Login user             | ❌       |
| GET    | `/api/tracks`        | Get all tracks         | ✅       |
| GET    | `/api/podcasts`      | Get all podcasts       | ✅       |
| GET    | `/api/playlists`     | Get user playlists     | ✅       |
| POST   | `/api/playlists`     | Create playlist        | ✅       |
| GET    | `/api/favorites`     | Get liked songs        | ✅       |
| POST   | `/api/favorites/:id` | Like a track           | ✅       |
| GET    | `/api/history`       | Get listening history  | ✅       |
| GET    | `/api/search?q=...`  | Search tracks/podcasts | ✅       |
| POST   | `/api/upload/audio`  | Upload audio file      | ✅ Admin |

## 📁 Project Structure

```
src/
├── config/
│   ├── env.js          # Environment config
│   └── supabase.js     # Supabase client
├── controllers/        # Route handlers
├── middleware/
│   ├── auth.js         # JWT verification
│   ├── admin.js        # Admin check
│   └── errorHandler.js # Global error handler
├── routes/             # API routes
└── app.js              # Express app setup
```

## 🗄️ Database Schema

See `supabase_schema.sql` for complete schema including:

- `profiles` - User profiles
- `tracks` - Music tracks
- `podcasts` - Podcast shows
- `episodes` - Podcast episodes
- `playlists` - User playlists
- `playlist_tracks` - Playlist-track junction
- `favorites` - Liked songs
- `recently_played` - Listening history

## 📝 License

MIT License

## 🔗 Related

- [Frontend Client](https://github.com/ChetuM10/music_streaming_client)
