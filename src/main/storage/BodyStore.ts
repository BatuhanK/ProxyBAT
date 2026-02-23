import { ClassicLevel } from "classic-level";
import { app } from "electron";
import { mkdirSync } from "fs";
import { join } from "path";

export class BodyStore {
  private static instance: BodyStore;
  private db: ClassicLevel<string, Buffer> | null = null;

  static getInstance(): BodyStore {
    if (!BodyStore.instance) {
      BodyStore.instance = new BodyStore();
    }
    return BodyStore.instance;
  }

  async initialize(): Promise<void> {
    const userDataPath = app.getPath("userData");
    const dbDir = join(userDataPath, "data", "bodies");
    mkdirSync(dbDir, { recursive: true });

    this.db = new ClassicLevel<string, Buffer>(dbDir, {
      valueEncoding: "buffer",
    });
  }

  private getDb(): ClassicLevel<string, Buffer> {
    if (!this.db) throw new Error("BodyStore not initialized");
    return this.db;
  }

  async put(key: string, data: Buffer): Promise<void> {
    await this.getDb().put(key, data);
  }

  async get(
    key: string,
    offset = 0,
    limit?: number,
  ): Promise<{ data: Buffer; totalBytes: number }> {
    const full = await this.getDb().get(key);
    const totalBytes = full.length;

    if (offset === 0 && limit === undefined) {
      return { data: full, totalBytes };
    }

    const end = limit !== undefined ? offset + limit : undefined;
    return { data: full.slice(offset, end), totalBytes };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.getDb().del(key);
    } catch {
      // key might not exist
    }
  }

  async close(): Promise<void> {
    await this.db?.close();
  }
}
