import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead & { createdAt: string }): Promise<Lead>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  currentId: number;
  currentLeadId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.currentId = 1;
    this.currentLeadId = 1;
  }

  async createLead(lead: InsertLead & { createdAt: string }): Promise<Lead> {
    const id = this.currentLeadId++;
    const newLead = { ...lead, id };
    this.leads.set(id, newLead);
    return newLead;
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
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
