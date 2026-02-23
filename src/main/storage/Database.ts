import BetterSqlite3 from "better-sqlite3";
import { app } from "electron";
import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export class Database {
  private static instance: Database;
  private db: BetterSqlite3.Database | null = null;

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize(): Promise<void> {
    const userDataPath = app.getPath("userData");
    const dbDir = join(userDataPath, "data");
    mkdirSync(dbDir, { recursive: true });

    const dbPath = join(dbDir, "ProxyBat.db");
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.runMigrations();
  }

  getDb(): BetterSqlite3.Database {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  private runMigrations(): void {
    const db = this.getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `);

    const applied = db
      .prepare("SELECT version FROM schema_migrations ORDER BY version")
      .all() as Array<{ version: number }>;
    const appliedVersions = new Set(applied.map((r) => r.version));

    const migrations = this.getMigrations();
    for (const [version, sql] of migrations) {
      if (!appliedVersions.has(version)) {
        db.exec(sql);
        db.prepare(
          "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        ).run(version, Date.now());
      }
    }
  }

  private getMigrations(): Array<[number, string]> {
    return [
      [
        1,
        `
        CREATE TABLE IF NOT EXISTS proxy_sessions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          ended_at INTEGER,
          status TEXT NOT NULL DEFAULT 'active',
          request_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS requests (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES proxy_sessions(id) ON DELETE CASCADE,
          timestamp INTEGER NOT NULL,
          method TEXT NOT NULL,
          url TEXT NOT NULL,
          host TEXT NOT NULL,
          path TEXT NOT NULL,
          status_code INTEGER,
          request_headers TEXT NOT NULL DEFAULT '{}',
          response_headers TEXT NOT NULL DEFAULT '{}',
          request_body_key TEXT,
          response_body_key TEXT,
          content_type TEXT,
          duration_ms INTEGER,
          ssl_intercepted INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id);
        CREATE INDEX IF NOT EXISTS idx_requests_host ON requests(host);
        CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
        CREATE INDEX IF NOT EXISTS idx_requests_status_code ON requests(status_code);

        CREATE TABLE IF NOT EXISTS ssl_rules (
          id TEXT PRIMARY KEY,
          pattern TEXT NOT NULL UNIQUE,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scripts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL DEFAULT '',
          enabled INTEGER NOT NULL DEFAULT 1,
          phase TEXT NOT NULL DEFAULT 'both',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES
          ('proxy_port', '8080'),
          ('proxy_host', '0.0.0.0'),
          ('ssl_enabled', 'true');
        `,
      ],
      [
        2,
        `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT 'New Chat',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
        `,
      ],
      [
        3,
        `
        INSERT OR IGNORE INTO settings (key, value) VALUES
          ('workspace_dir', '${join(homedir(), "Desktop", "ProxyBat")}');
        `,
      ],
      [
        4,
        `
        ALTER TABLE chat_sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'general';
        `,
      ],
      [
        5,
        `
        ALTER TABLE chat_sessions ADD COLUMN linked_proxy_session_id TEXT;
        `,
      ],
      [
        6,
        `
        CREATE TABLE IF NOT EXISTS ignore_rules (
          id TEXT PRIMARY KEY,
          pattern TEXT NOT NULL UNIQUE,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL
        );
        `,
      ],
    ];
  }
}
