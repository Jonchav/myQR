import { users, qrCodes, type User, type InsertUser, type QRCode, type InsertQRCode } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createQRCode(qrCode: InsertQRCode): Promise<QRCode>;
  getQRCodes(): Promise<QRCode[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private qrCodes: Map<number, QRCode>;
  private currentUserId: number;
  private currentQRCodeId: number;

  constructor() {
    this.users = new Map();
    this.qrCodes = new Map();
    this.currentUserId = 1;
    this.currentQRCodeId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQRCode(insertQRCode: InsertQRCode): Promise<QRCode> {
    const id = this.currentQRCodeId++;
    const qrCode: QRCode = { 
      ...insertQRCode, 
      id,
      createdAt: new Date()
    };
    this.qrCodes.set(id, qrCode);
    return qrCode;
  }

  async getQRCodes(): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const storage = new MemStorage();
