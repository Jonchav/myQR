import {
  users,
  qrCodes,
  qrScans,
  userPreferences,
  type User,
  type UpsertUser,
  type QRCode,
  type QRScan,
  type InsertQRCode,
  type UserPreferences,
  type InsertUserPreferences,
  type UpdateUserPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    trialUsed?: boolean;
  }): Promise<User | undefined>;
  
  // QR Code operations
  createQRCode(qrCode: any, userId?: string): Promise<QRCode>;
  getQRCodes(userId?: string, limit?: number, offset?: number): Promise<QRCode[]>;
  getQRCode(id: number): Promise<QRCode | undefined>;
  getQRCodeById(id: string): Promise<QRCode | undefined>;
  incrementScanCount(id: string): Promise<void>;
  deleteQRCode(id: number, userId?: string): Promise<boolean>;
  updateQRCode(id: number, updates: any, userId?: string): Promise<QRCode | undefined>;
  maintainQRLimit(userId: string, limit?: number): Promise<void>;
  
  // QR Code statistics operations
  recordQRScan(qrCodeId: number, userAgent?: string, ipAddress?: string, country?: string): Promise<void>;
  getQRScanStats(qrCodeId: number): Promise<{
    total: number;
    today: number;
    thisMonth: number;
    thisYear: number;
    dailyStats: Array<{ date: string; count: number }>;
  }>;
  getQRScanRecords(qrCodeId: number): Promise<QRScan[]>;
  getQRCodeWithStats(id: number): Promise<QRCode & { scanStats: any } | undefined>;
  
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    trialUsed?: boolean;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
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
    
    // Si hay userId, mantener solo los últimos 100 QR codes del usuario
    if (userId) {
      await this.maintainQRLimit(userId);
    }
    
    return qrCode;
  }

  async maintainQRLimit(userId: string, limit: number = 100): Promise<void> {
    // Obtener el total de QR codes del usuario
    const totalQRs = await db
      .select({ count: sql<number>`count(*)` })
      .from(qrCodes)
      .where(eq(qrCodes.userId, userId));
    
    const count = totalQRs[0]?.count || 0;
    
    // Si excede el límite, eliminar los más antiguos
    if (count > limit) {
      const excessCount = count - limit;
      
      // Obtener los IDs de los QR codes más antiguos a eliminar
      const oldestQRs = await db
        .select({ id: qrCodes.id })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId))
        .orderBy(qrCodes.createdAt)
        .limit(excessCount);
      
      // Eliminar los QR codes más antiguos
      if (oldestQRs.length > 0) {
        const idsToDelete = oldestQRs.map(qr => qr.id);
        await db
          .delete(qrCodes)
          .where(
            and(
              eq(qrCodes.userId, userId),
              inArray(qrCodes.id, idsToDelete)
            )
          );
      }
    }
  }

  async getQRCodes(userId?: string, limit: number = 50, offset: number = 0): Promise<QRCode[]> {
    const query = db.select().from(qrCodes);
    
    if (userId) {
      return await query
        .where(eq(qrCodes.userId, userId))
        .orderBy(desc(qrCodes.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      return await query
        .orderBy(desc(qrCodes.createdAt))
        .limit(limit)
        .offset(offset);
    }
  }

  async getQRCode(id: number): Promise<QRCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async getQRCodeById(id: string): Promise<QRCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, parseInt(id)));
    return qrCode;
  }

  async incrementScanCount(id: string): Promise<void> {
    await db
      .update(qrCodes)
      .set({ 
        scanCount: sql`${qrCodes.scanCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(qrCodes.id, parseInt(id)));
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

  // QR Code statistics operations
  async recordQRScan(qrCodeId: number, userAgent?: string, ipAddress?: string, country?: string): Promise<void> {
    await db.insert(qrScans).values({
      qrCodeId,
      userAgent,
      ipAddress,
      country,
      scannedAt: new Date(),
    });
    
    // Update scan count
    await db
      .update(qrCodes)
      .set({
        scanCount: sql`${qrCodes.scanCount} + 1`,
      })
      .where(eq(qrCodes.id, qrCodeId));
  }

  async getQRScanRecords(qrCodeId: number): Promise<QRScan[]> {
    return await db
      .select()
      .from(qrScans)
      .where(eq(qrScans.qrCodeId, qrCodeId))
      .orderBy(desc(qrScans.scannedAt));
  }

  async getQRScanStats(qrCodeId: number): Promise<{
    total: number;
    today: number;
    thisMonth: number;
    thisYear: number;
    dailyStats: Array<{ date: string; count: number }>;
  }> {
    const now = new Date();
    // Use UTC to ensure consistent timezone handling
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    
    // Get total scans
    const [totalResult] = await db
      .select({ count: count() })
      .from(qrScans)
      .where(eq(qrScans.qrCodeId, qrCodeId));
    
    // Get today's scans (using proper date comparison)
    const todayDateStr = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const [todayResult] = await db
      .select({ count: count() })
      .from(qrScans)
      .where(
        and(
          eq(qrScans.qrCodeId, qrCodeId),
          sql`DATE(${qrScans.scannedAt}) = ${todayDateStr}`
        )
      );
    
    // Get this month's scans
    const [monthResult] = await db
      .select({ count: count() })
      .from(qrScans)
      .where(
        and(
          eq(qrScans.qrCodeId, qrCodeId),
          sql`${qrScans.scannedAt} >= ${startOfMonth}`
        )
      );
    
    // Get this year's scans
    const [yearResult] = await db
      .select({ count: count() })
      .from(qrScans)
      .where(
        and(
          eq(qrScans.qrCodeId, qrCodeId),
          sql`${qrScans.scannedAt} >= ${startOfYear}`
        )
      );
    
    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const dailyStats = await db
      .select({
        date: sql`DATE(${qrScans.scannedAt})`.as('date'),
        count: count(),
      })
      .from(qrScans)
      .where(
        and(
          eq(qrScans.qrCodeId, qrCodeId),
          sql`DATE(${qrScans.scannedAt}) >= ${thirtyDaysAgoStr}`
        )
      )
      .groupBy(sql`DATE(${qrScans.scannedAt})`)
      .orderBy(sql`DATE(${qrScans.scannedAt})`);
    
    return {
      total: totalResult?.count ?? 0,
      today: todayResult?.count ?? 0,
      thisMonth: monthResult?.count ?? 0,
      thisYear: yearResult?.count ?? 0,
      dailyStats: dailyStats.map(stat => ({
        date: stat.date as string,
        count: stat.count,
      })),
    };
  }

  async getQRCodeWithStats(id: number): Promise<QRCode & { scanStats: any } | undefined> {
    const qrCode = await this.getQRCode(id);
    if (!qrCode) return undefined;
    
    const scanStats = await this.getQRScanStats(id);
    return {
      ...qrCode,
      scanStats,
    };
  }

  // History operations
  async clearUserHistory(userId: string): Promise<boolean> {
    try {
      console.log('Starting clearUserHistory for user:', userId);
      
      // Get all QR codes for this user first
      const userQRCodes = await db.select({ id: qrCodes.id })
        .from(qrCodes)
        .where(eq(qrCodes.userId, userId));
      
      console.log('Found QR codes to delete:', userQRCodes.length);
      
      if (userQRCodes.length === 0) {
        console.log('No QR codes found for user, returning true');
        return true;
      }
      
      // Delete scans one by one to avoid SQL complexity
      let deletedScansCount = 0;
      for (const qrCode of userQRCodes) {
        const result = await db.delete(qrScans)
          .where(eq(qrScans.qrCodeId, qrCode.id));
        deletedScansCount += result.rowCount ?? 0;
      }
      console.log('Scans deleted:', deletedScansCount);
      
      // Delete all QR codes for this user
      const qrDeleteResult = await db.delete(qrCodes)
        .where(eq(qrCodes.userId, userId));
      console.log('QR codes deleted:', qrDeleteResult.rowCount);
      
      return true;
    } catch (error) {
      console.error('Error clearing user history:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
