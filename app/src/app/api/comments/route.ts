import { NextRequest, NextResponse, after } from "next/server";
import { moderateComment } from "@/lib/ai";
import { evaluateSanction } from "@/lib/sanctions";
import { readComments, writeComments } from "@/lib/storage";

// Sanction durations are server policy: set FAST_TEST_MODE=true for short demo mutes
const fastTestMode = process.env.FAST_TEST_MODE === "true";

export async function GET(req: NextRequest) {
  const comments = readComments();
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  try {
    const accountId = req.cookies.get("accountId")?.value;
    if (!accountId) {
      return NextResponse.json({ error: "Missing account ID" }, { status: 401 });
    }

    const { text, postId = "post_1" } = await req.json();
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // 1. Cek status sanksi saat ini
    const currentStatus = evaluateSanction(accountId, false, undefined, fastTestMode).status;
    if (!currentStatus.canComment) {
      return NextResponse.json(
        { error: `Akun Anda sedang dibisukan (${currentStatus.timeRemaining || "aktif"}).`, status: currentStatus },
        { status: 403 }
      );
    }

    // 2. SIMPAN KOMENTAR SEGERA (review pending) — upload tidak menunggu AI
    const newCommentId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const comments = readComments();
    comments.unshift({
      id: newCommentId,
      postId,
      accountId,
      text,
      createdAt: new Date().toISOString(),
      flagged: false,
      review: "pending",
    });
    if (comments.length > 100) comments.length = 100;
    writeComments(comments);

    // 3. PENINJAUAN AI DI BELAKANG (setelah response terkirim)
    after(async () => {
      const finish = (mutate: (list: ReturnType<typeof readComments>, idx: number) => void) => {
        const latest = readComments();
        const idx = latest.findIndex((c) => c.id === newCommentId);
        if (idx === -1) return; // komentar sudah dihapus (reset dsb.)
        mutate(latest, idx);
        writeComments(latest);
      };

      try {
        const aiResult = await moderateComment(text);

        if (aiResult.isViolation) {
          // Sanksi dulu, baru update komentar (level > 1 = komentar disembunyikan)
          const { levelAssigned } = evaluateSanction(accountId, true, {
            text,
            category: aiResult.category,
            reason: aiResult.reasoning,
          }, fastTestMode);

          finish((list, idx) => {
            if (levelAssigned > 1) {
              list.splice(idx, 1);
            } else {
              const c = list[idx];
              c.flagged = true;
              c.category = aiResult.category;
              c.reason = aiResult.reasoning;
              c.review = "done";
            }
          });
        } else {
          finish((list, idx) => {
            list[idx].review = "done";
          });
        }
      } catch (err) {
        // Review gagal: komentar tetap tampil tanpa flag, jangan stuck pending
        console.error("Background AI review failed:", err);
        finish((list, idx) => {
          list[idx].review = "done";
        });
      }
    });

    // 4. RESPONSE LANGSUNG (client tampilkan komentar, hasil AI menyusul via polling)
    return NextResponse.json({
      success: true,
      message: "Komentar berhasil dikirim",
      commentId: newCommentId,
      pendingReview: true,
    });
  } catch (error) {
    console.error("API /comments error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: String(error) }, { status: 500 });
  }
}
