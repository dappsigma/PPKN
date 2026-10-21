import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface ViolationsHistory {
  level: number; // 0 (aman), 1 (peringatan), 2 (mute 24h), 3 (mute 7d), 4 (dibatasi)
  count: number; // Jumlah total pelanggaran
  mutedUntil?: string | null; // ISO Date String
  isRestricted?: boolean;
  history: Array<{
    timestamp: string;
    comment: string;
    category: string;
    reason: string;
    levelAssigned: number;
  }>;
}

export interface AccountData {
  [accountId: string]: ViolationsHistory;
}

export interface CommentData {
  id: string;
  postId: string; // New field to associate comment with a post
  accountId: string;
  text: string;
  createdAt: string;
  flagged: boolean;
  review?: "pending" | "done"; // AI review state: "pending" while background review runs
  category?: string;
  reason?: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(filename: string) {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

// Atomic write: temp file + rename so a crash never leaves a truncated JSON file.
// ponytail: all read-modify-write call sites are synchronous, so the event loop
// serializes them; add a queue/SQLite only if writes ever span await points or processes.
function atomicWrite(filePath: string, contents: string): void {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, contents);
  fs.renameSync(tmpPath, filePath);
}

export function readAccounts(): AccountData {
  const filePath = getFilePath("accounts.json");
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeAccounts(data: AccountData): void {
  atomicWrite(getFilePath("accounts.json"), JSON.stringify(data, null, 2));
}

export function readComments(): CommentData[] {
  const filePath = getFilePath("comments.json");
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Komentar yang terdeteksi bermasalah otomatis difilter keluar agar tidak tampil
    return parsed.filter((c) => !c.flagged);
  } catch {
    return [];
  }
}

export function writeComments(comments: CommentData[]): void {
  atomicWrite(getFilePath("comments.json"), JSON.stringify(comments, null, 2));
}

export interface PostSettings {
  commentsOpen: boolean;
}

export function readSettings(): PostSettings {
  const filePath = getFilePath("settings.json");
  if (!fs.existsSync(filePath)) {
    const defaults: PostSettings = { commentsOpen: true };
    fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { commentsOpen: true };
  }
}

export function writeSettings(settings: PostSettings): void {
  atomicWrite(getFilePath("settings.json"), JSON.stringify(settings, null, 2));
}
