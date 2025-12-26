import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * Swagger/OpenAPI Configuration
 *
 * Provides interactive API documentation at /api/docs
 */

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Melodify Music Streaming API",
      version: "1.0.0",
      description: `
# Melodify API Documentation

A full-featured music streaming API with:
- 🔐 JWT Authentication via Supabase
- 🎵 Track & Playlist Management
- 🎙️ Podcast Support
- 🔍 Full-Text Search
- 🎯 AI-Powered Recommendations
- ⚡ Real-Time WebSocket Events

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`
      `,
      contact: {
        name: "API Support",
        email: "support@melodify.app",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
      {
        url: "https://api.melodify.app/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Track: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", example: "Fade Away" },
            artist: { type: "string", example: "Electronic Dreams" },
            album: { type: "string", example: "Digital Horizons" },
            genre: { type: "string", example: "Electronic" },
            duration: { type: "integer", example: 245 },
            audio_url: { type: "string", format: "uri" },
            cover_url: { type: "string", format: "uri" },
            play_count: { type: "integer", example: 1500 },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Playlist: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "My Favorites" },
            description: { type: "string" },
            cover_url: { type: "string", format: "uri" },
            is_public: { type: "boolean" },
            track_count: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Podcast: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            host: { type: "string" },
            description: { type: "string" },
            cover_url: { type: "string", format: "uri" },
            category: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            avatar_url: { type: "string", format: "uri" },
            is_admin: { type: "boolean" },
          },
        },
        ArtistProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            artist_name: { type: "string" },
            bio: { type: "string" },
            profile_image: { type: "string", format: "uri" },
            verified: { type: "boolean" },
            follower_count: { type: "integer" },
            monthly_listeners: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Tracks", description: "Music track operations" },
      { name: "Playlists", description: "Playlist management" },
      { name: "Podcasts", description: "Podcast operations" },
      { name: "Search", description: "Search functionality" },
      { name: "Recommendations", description: "AI-powered recommendations" },
      { name: "Favorites", description: "User favorites" },
      { name: "History", description: "Listening history" },
      { name: "Artist", description: "Artist dashboard & uploads" },
      { name: "GDPR", description: "Data privacy & compliance" },
    ],
    paths: {
      // Auth
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "username"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    username: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Invalid input" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns JWT token" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      // Tracks
      "/tracks": {
        get: {
          tags: ["Tracks"],
          summary: "Get all tracks",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
            },
            { name: "genre", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "List of tracks",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          tracks: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Track" },
                          },
                          total: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/tracks/{id}": {
        get: {
          tags: ["Tracks"],
          summary: "Get track by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Track details" },
            404: { description: "Track not found" },
          },
        },
      },
      // Playlists
      "/playlists": {
        get: {
          tags: ["Playlists"],
          summary: "Get user playlists",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of playlists" } },
        },
        post: {
          tags: ["Playlists"],
          summary: "Create playlist",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Playlist created" } },
        },
      },
      // Search
      "/search": {
        get: {
          tags: ["Search"],
          summary: "Search tracks, podcasts, artists",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["all", "tracks", "podcasts"] },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Search results" } },
        },
      },
      "/search/suggestions": {
        get: {
          tags: ["Search"],
          summary: "Get autocomplete suggestions",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Suggestions list" } },
        },
      },
      // Recommendations
      "/recommendations": {
        get: {
          tags: ["Recommendations"],
          summary: "Get personalized recommendations",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Recommended tracks based on listening history",
            },
          },
        },
      },
      "/recommendations/similar/{trackId}": {
        get: {
          tags: ["Recommendations"],
          summary: "Get similar tracks",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "trackId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Similar tracks" } },
        },
      },
      // Favorites
      "/favorites": {
        get: {
          tags: ["Favorites"],
          summary: "Get user favorites",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of favorite tracks" } },
        },
        post: {
          tags: ["Favorites"],
          summary: "Add track to favorites",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["track_id"],
                  properties: { track_id: { type: "string", format: "uuid" } },
                },
              },
            },
          },
          responses: { 201: { description: "Added to favorites" } },
        },
      },
      // GDPR
      "/user/export": {
        get: {
          tags: ["GDPR"],
          summary: "Export all user data",
          description: "Download all personal data as JSON (GDPR compliance)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "JSON file with all user data",
              content: { "application/json": {} },
            },
          },
        },
      },
      "/user/account": {
        delete: {
          tags: ["GDPR"],
          summary: "Delete account",
          description: "Permanently delete account and all associated data",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Account deleted" },
            401: { description: "Unauthorized" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Swagger UI
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
    `,
      customSiteTitle: "Melodify API Docs",
    })
  );

  // JSON spec endpoint
  app.get("/api/docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  console.log("✅ Swagger API docs available at /api/docs");
};

export default swaggerSpec;
