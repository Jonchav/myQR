import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

// Simple authentication for deployment platforms
function createMockUser() {
  return {
    id: "demo-user",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple session-based authentication
  app.get("/api/login", async (req, res) => {
    try {
      // Auto-login with demo user for deployment
      const mockUser = createMockUser();
      await storage.upsertUser(mockUser);
      
      // Store user in session
      (req.session as any).user = mockUser;
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    try {
      (req.session as any).user = null;
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Add user to request object for compatibility
  (req as any).user = user;
  return next();
};
