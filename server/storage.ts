import {
  users,
  qrCodes,
  userPreferences,
  type User,
  type UpsertUser,
  type QRCode,
  type InsertQRCode,
  type UserPreferences,
  type InsertUserPreferences,
  type UpdateUserPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  // QR Code operations
  createQRCode(qrCode: any, userId?: string): Promise<QRCode>;
  getQRCodes(userId?: string): Promise<QRCode[]>;
  getQRCode(id: number): Promise<QRCode | undefined>;
  deleteQRCode(id: number, userId?: string): Promise<boolean>;
  updateQRCode(id: number, updates: any, userId?: string): Promise<QRCode | undefined>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined>;
  
  // History operations
  clearUserHistory(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // QR Code operations
  async createQRCode(qrData: any, userId?: string): Promise<QRCode> {
    const insertData = {
      ...qrData,
      userId: userId || null,
    };
    
    const [qrCode] = await db
      .insert(qrCodes)
      .values(insertData)
      .returning();
    return qrCode;
  }

  async getQRCodes(userId?: string): Promise<QRCode[]> {
    const query = db.select().from(qrCodes);
    
    if (userId) {
      return await query.where(eq(qrCodes.userId, userId)).orderBy(desc(qrCodes.createdAt));
    } else {
      return await query.orderBy(desc(qrCodes.createdAt));
    }
  }

  async getQRCode(id: number): Promise<QRCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async deleteQRCode(id: number, userId?: string): Promise<boolean> {
    const conditions = [eq(qrCodes.id, id)];
    if (userId) {
      conditions.push(eq(qrCodes.userId, userId));
    }

    const result = await db.delete(qrCodes).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  async updateQRCode(id: number, updates: any, userId?: string): Promise<QRCode | undefined> {
    const conditions = [eq(qrCodes.id, id)];
    if (userId) {
      conditions.push(eq(qrCodes.userId, userId));
    }

    const [qrCode] = await db
      .update(qrCodes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();
    return qrCode;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(userId: string, preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [prefs] = await db
      .insert(userPreferences)
      .values({
        ...preferences,
        userId,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .update(userPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return prefs;
  }

  // History operations
  async clearUserHistory(userId: string): Promise<boolean> {
    const result = await db.delete(qrCodes).where(eq(qrCodes.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
