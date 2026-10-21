/**
 * Modul Keamanan Siber PPKN
 * - Deteksi & Perlindungan Serangan SQL Injection (SQLi)
 * - Sanitasi Input & Validasi Pengenal (ID)
 * - Pencegahan Cross-Site Scripting (XSS)
 */

// Pola komprehensif untuk mendeteksi berbagai jenis serangan SQL Injection
const SQL_INJECTION_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  // 1. Tautologi Klasik (OR 1=1, ' OR 'a'='a, ' OR '1'='1', dll.)
  {
    regex: /(?:'|"|`)\s*(?:or|and|xor)\s+(?:'|"|`|[\d\w])+\s*=\s*(?:'|"|`|[\d\w])+/i,
    name: "Tautologi SQL Boolean (OR 1=1 / 'a'='a')",
  },
  {
    regex: /\b(?:or|and)\s+(?:1\s*=\s*1|0\s*=\s*0|true\s*=\s*true)\b/i,
    name: "Pernyataan Selalu Benar (OR 1=1)",
  },
  {
    regex: /(?:'|"|`)\s*(?:or|and)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/i,
    name: "Tautologi String SQL (' OR ''=')",
  },

  // 2. UNION Based SQL Injection
  {
    regex: /\bunion(?:\s+all)?\s+select\b/i,
    name: "UNION SELECT Injection",
  },

  // 3. Stacked Queries & Manipulasi Struktur Database (DROP, DELETE, UPDATE, TRUNCATE)
  {
    regex: /(?:;|\b)\s*(?:drop\s+(?:table|database|view|index)|truncate\s+table|alter\s+table)\b/i,
    name: "Perintah Destruktif Database (DROP/TRUNCATE/ALTER)",
  },
  {
    regex: /(?:;|\b)\s*(?:delete\s+from|insert\s+into|update\s+[\w`]+\s+set)\b/i,
    name: "Manipulasi Data SQL (INSERT/UPDATE/DELETE)",
  },

  // 4. Komentar SQL (sering dipakai memotong query asli agar sisa query tidak dieksekusi)
  {
    regex: /(?:--\s|\/\*[\s\S]*?\*\/|#\s*$|--$)/,
    name: "Komentar Pemotong Query SQL (-- atau /* */)",
  },

  // 5. Time-based & Fingerprinting Function Injection (SLEEP, BENCHMARK, WAITFOR)
  {
    regex: /\b(?:sleep\s*\(\s*\d+\s*\)|benchmark\s*\(\s*\d+|waitfor\s+delay)\b/i,
    name: "Time-Based Blind SQL Injection (SLEEP / BENCHMARK)",
  },
  {
    regex: /\b(?:load_file\s*\(|into\s+(?:out|dump)file)\b/i,
    name: "Ekstraksi File Database (LOAD_FILE / OUTFILE)",
  },

  // 6. Metadata & System Catalogs Probing
  {
    regex: /\b(?:information_schema|sysobjects|syscolumns|all_tables|user_tables|pg_catalog|@@version)\b/i,
    name: "Eksplorasi Skema Database (INFORMATION_SCHEMA / @@VERSION)",
  },

  // 7. Command Execution via Database (XP_CMDSHELL dsb.)
  {
    regex: /\b(?:exec(?:ute)?\s*(?:xp_cmdshell|sp_executesql)|sys\.sp_)\b/i,
    name: "Eksekusi Perintah Sistem Database (XP_CMDSHELL)",
  },
];

export interface SqlInjectionDetectionResult {
  isSqlInjection: boolean;
  threatName?: string;
  matchedPattern?: string;
  reason?: string;
}

/**
 * Memeriksa apakah suatu teks mengandung upaya serangan SQL Injection
 */
export function detectSqlInjection(input: string): SqlInjectionDetectionResult {
  if (!input || typeof input !== "string") {
    return { isSqlInjection: false };
  }

  // Normalisasi spasi dan decode URI komponen jika ada
  let normalized = input.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Jika format URI invalid, gunakan string asli
  }

  for (const { regex, name } of SQL_INJECTION_PATTERNS) {
    if (regex.test(normalized)) {
      return {
        isSqlInjection: true,
        threatName: name,
        matchedPattern: regex.source,
        reason: `Terdeteksi pola serangan keamanan SQL Injection: ${name}. Sistem menolak dan menghapus input secara langsung demi menjaga integritas database dan aplikasi.`,
      };
    }
  }

  return { isSqlInjection: false };
}

/**
 * Validasi ID aman: hanya karakter alfanumerik, garis bawah, tanda hubung, atau titik.
 * Mencegah Directory Traversal (../) dan SQL Injection pada parameter ID.
 */
export function isValidSafeIdentifier(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  if (id.length > 100) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(id);
}

/**
 * Membersihkan teks dari karakter kontrol berbahaya dan tag HTML/skrip jahat (XSS)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\0/g, "") // Hapus Null byte
    .replace(/[<>]/g, "") // Hapus bracket HTML untuk mencegah XSS
    .trim();
}
