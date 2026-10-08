import { AccountData, readAccounts, writeAccounts } from "./storage";

export interface SanctionStatus {
  level: number;
  levelName: string;
  isMuted: boolean;
  isRestricted: boolean;
  mutedUntil: string | null;
  historyCount: number;
  canComment: boolean;
  timeRemaining?: string;
  isFastTestMode?: boolean;
  history: Array<{
    timestamp: string;
    comment: string;
    category: string;
    reason: string;
    levelAssigned: number;
  }>;
}

export function evaluateSanction(
  accountId: string, 
  isNewViolation: boolean, 
  commentDetails?: { text: string; category: string; reason: string },
  fastTestMode: boolean = false // server policy; pass process.env.FAST_TEST_MODE === "true"
): { status: SanctionStatus; levelAssigned: number } {
  const accounts: AccountData = readAccounts();
  const account = accounts[accountId] || {
    level: 0,
    count: 0,
    mutedUntil: null,
    isRestricted: false,
    history: [],
  };

  const now = new Date();

  // Check if currently muted
  let isCurrentlyMuted = false;
  if (account.mutedUntil) {
    const mutedUntilDate = new Date(account.mutedUntil);
    if (mutedUntilDate > now) {
      isCurrentlyMuted = true;
    }
  }

  let newLevel = account.level;

  // Durasi Mute: Mode Cepat Demo vs Mode Normal
  const level2Duration = fastTestMode ? 15 * 1000 : 24 * 60 * 60 * 1000; // 15 detik vs 24 jam
  const level3Duration = fastTestMode ? 45 * 1000 : 7 * 24 * 60 * 60 * 1000; // 45 detik vs 7 hari

  if (isNewViolation) {
    account.count += 1;
    const currentViolationNum = account.count;

    if (currentViolationNum === 1) {
      newLevel = 1; // Peringatan
    } else if (currentViolationNum === 2) {
      newLevel = 2; // Mute Level 2
      const muteEnd = new Date(now.getTime() + level2Duration);
      account.mutedUntil = muteEnd.toISOString();
      isCurrentlyMuted = true;
    } else if (currentViolationNum === 3) {
      newLevel = 3; // Mute Level 3
      const muteEnd = new Date(now.getTime() + level3Duration);
      account.mutedUntil = muteEnd.toISOString();
      isCurrentlyMuted = true;
    } else {
      newLevel = 4; // Dibatasi Permanen / Kunci
      account.isRestricted = true;
    }

    account.level = newLevel;

    if (commentDetails) {
      account.history.unshift({
        timestamp: now.toISOString(),
        comment: commentDetails.text,
        category: commentDetails.category,
        reason: commentDetails.reason,
        levelAssigned: newLevel,
      });
    }

    accounts[accountId] = account;
    writeAccounts(accounts);
  }

  // Formatting response
  const isRestricted = account.level >= 4 || !!account.isRestricted;
  const canComment = !isCurrentlyMuted && !isRestricted;

  let levelName = "Aman (Tidak Ada Sanksi)";
  if (account.level === 1) levelName = "Level 1: Peringatan";
  if (account.level === 2) levelName = fastTestMode ? "Level 2: Mute (15 Dtk Test)" : "Level 2: Mute 24 Jam";
  if (account.level === 3) levelName = fastTestMode ? "Level 3: Mute (45 Dtk Test)" : "Level 3: Mute 7 Hari";
  if (account.level >= 4) levelName = "Level 4: Pembatasan Akun";

  let timeRemaining = "";
  if (isCurrentlyMuted && account.mutedUntil) {
    const diff = new Date(account.mutedUntil).getTime() - now.getTime();
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        timeRemaining = `${hours}j ${mins}m tersisa`;
      } else if (mins > 0) {
        timeRemaining = `${mins}m ${secs}d tersisa`;
      } else {
        timeRemaining = `${secs} detik tersisa`;
      }
    }
  }

  return {
    status: {
      level: account.level,
      levelName,
      isMuted: isCurrentlyMuted,
      isRestricted,
      mutedUntil: account.mutedUntil ?? null,
      historyCount: account.count,
      canComment,
      timeRemaining,
      isFastTestMode: fastTestMode,
      history: account.history,
    },
    levelAssigned: newLevel,
  };
}

export function getAccountStatus(accountId: string, fastTestMode: boolean = false): SanctionStatus {
  return evaluateSanction(accountId, false, undefined, fastTestMode).status;
}

export function resetAccountSanction(accountId: string): void {
  const accounts = readAccounts();
  delete accounts[accountId];
  writeAccounts(accounts);
}
