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
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function createDemoUser() {
  return {
    id: "demo-user-" + Date.now(),
    email: "demo@myqr.app",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Auto-login endpoint
  app.get("/api/login", async (req, res) => {
    try {
      const demoUser = createDemoUser();
      await storage.upsertUser(demoUser);
      
      (req.session as any).user = demoUser;
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
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

  // Callback endpoint (for compatibility)
  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = user;
  return next();
};