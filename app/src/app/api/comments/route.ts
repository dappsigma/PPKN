import { NextRequest, NextResponse, after } from "next/server";
import { moderateComment } from "@/lib/ai";
import { evaluateSanction } from "@/lib/sanctions";
import { readComments, writeComments, readSettings, writeSettings } from "@/lib/storage";
import { detectSqlInjection, isValidSafeIdentifier, sanitizeText } from "@/lib/security";

// Sanction durations are server policy: set FAST_TEST_MODE=true for short demo mutes
const fastTestMode = process.env.FAST_TEST_MODE === "true";

export async function GET(req: NextRequest) {
  const comments = readComments();
  const settings = readSettings();
  return NextResponse.json({ comments, commentsOpen: settings.commentsOpen });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = readSettings();
    if (typeof body.commentsOpen === "boolean") {
      settings.commentsOpen = body.commentsOpen;
    } else {
      settings.commentsOpen = !settings.commentsOpen;
    }
    writeSettings(settings);
    return NextResponse.json({
      success: true,
      commentsOpen: settings.commentsOpen,
      message: settings.commentsOpen
        ? "Fitur komentar telah dibuka."
        : "Fitur komentar telah ditutup.",
    });
  } catch (error) {
    console.error("API PATCH /comments error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengaturan komentar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accountId = req.cookies.get("accountId")?.value;
    if (!accountId) {
      return NextResponse.json({ error: "Missing account ID" }, { status: 401 });
    }

    if (!isValidSafeIdentifier(accountId)) {
      return NextResponse.json({ error: "Format ID akun tidak valid" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const rawText = body?.text;
    const postId = body?.postId || "post_1";

    if (!isValidSafeIdentifier(postId)) {
      return NextResponse.json({ error: "Format Post ID tidak valid" }, { status: 400 });
    }

    if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
      return NextResponse.json({ error: "Isi komentar wajib diisi" }, { status: 400 });
    }

    // 0. Cek apakah komentar ditutup oleh pemilik postingan
    const settings = readSettings();
    if (!settings.commentsOpen) {
      return NextResponse.json(
        { error: "Komentar untuk postingan ini telah dinonaktifkan." },
        { status: 403 }
      );
    }

    // 1. Cek status sanksi akun saat ini
    const currentStatus = evaluateSanction(accountId, false, undefined, fastTestMode).status;
    if (!currentStatus.canComment) {
      return NextResponse.json(
        { error: `Akun Anda sedang dibisukan (${currentStatus.timeRemaining || "aktif"}).`, status: currentStatus },
        { status: 403 }
      );
    }

    // 2. PERLINDUNGAN KEAMANAN SIBER: Deteksi SQL Injection pada teks komentar
    const sqliCheck = detectSqlInjection(rawText);
    if (sqliCheck.isSqlInjection) {
      // Komentar SQL injection LANGSUNG DITOLAK & DIHAPUS (tidak disimpan ke data)
      const { status, levelAssigned } = evaluateSanction(
        accountId,
        true,
        {
          text: rawText,
          category: "sql_injection",
          reason: `Percobaan SQL Injection terdeteksi: Komentar langsung dihapus dan diblokir untuk keamanan sistem. (${sqliCheck.threatName || "Pola Tidak Aman"})`,
        },
        fastTestMode
      );

      return NextResponse.json(
        {
          error: `Komentar terdeteksi mengandung indikasi serangan SQL Injection (${sqliCheck.threatName || "SQLi"}) dan langsung dihapus oleh sistem keamanan.`,
          securityViolation: true,
          threatName: sqliCheck.threatName,
          status,
          levelAssigned,
        },
        { status: 400 }
      );
    }

    // Sanitasi teks untuk mencegah XSS atau karakter kontrol berbahaya
    const text = sanitizeText(rawText);
    if (!text) {
      return NextResponse.json({ error: "Isi komentar tidak valid setelah sanitasi." }, { status: 400 });
    }

    // 3. SIMPAN KOMENTAR SEMENTARA (status review: pending)
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

    // 4. PENINJAUAN AI DI BELAKANG (moderasi otomatis)
    after(async () => {
      const finish = (mutate: (list: ReturnType<typeof readComments>, idx: number) => void) => {
        const latest = readComments();
        const idx = latest.findIndex((c) => c.id === newCommentId);
        if (idx === -1) return; // Komentar sudah dihapus
        mutate(latest, idx);
        writeComments(latest);
      };

      try {
        const aiResult = await moderateComment(text);

        if (aiResult.isViolation) {
          // Tetapkan sanksi pelanggaran ke akun
          evaluateSanction(
            accountId,
            true,
            {
              text,
              category: aiResult.category,
              reason: aiResult.reasoning,
            },
            fastTestMode
          );

          // ATURAN UTAMA: Ketika komentar terdeteksi bermasalah,
          // komentarnya HARUS LANGSUNG DIHAPUS dari daftar komentar (apapun level sanksinya)
          finish((list, idx) => {
            list.splice(idx, 1);
          });
        } else {
          // Komentar bersih: tandai review selesai
          finish((list, idx) => {
            list[idx].review = "done";
          });
        }
      } catch (err) {
        // Jika tinjauan gagal, biarkan selesai agar tidak macet di status pending
        console.error("Background AI review error:", err);
        finish((list, idx) => {
          list[idx].review = "done";
        });
      }
    });

    // 5. RESPONSE KE CLIENT
    return NextResponse.json({
      success: true,
      message: "Komentar berhasil dikirim dan sedang diverifikasi sistem",
      commentId: newCommentId,
      pendingReview: true,
    });
  } catch (error) {
    console.error("API /comments error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const allParam = searchParams.get("all");

    let commentId = idParam;
    let deleteAll = allParam === "true";

    if (!commentId && !deleteAll) {
      const body = await req.json().catch(() => ({}));
      commentId = body?.id || body?.commentId;
      deleteAll = body?.all === true;
    }

    if (deleteAll) {
      writeComments([]);
      return NextResponse.json({
        success: true,
        message: "Semua komentar berhasil dihapus.",
      });
    }

    if (!commentId) {
      return NextResponse.json(
        { error: "ID komentar diperlukan untuk menghapus." },
        { status: 400 }
      );
    }

    // Validasi parameter ID untuk mencegah injection pada URL/body
    if (!isValidSafeIdentifier(commentId)) {
      return NextResponse.json(
        { error: "Format ID komentar tidak valid atau mengandung karakter tidak aman." },
        { status: 400 }
      );
    }

    const comments = readComments();
    const initialLength = comments.length;
    const filteredComments = comments.filter((c) => c.id !== commentId);

    if (filteredComments.length === initialLength) {
      return NextResponse.json(
        { error: "Komentar tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      );
    }

    writeComments(filteredComments);

    return NextResponse.json({
      success: true,
      message: "Komentar berhasil dihapus.",
      deletedId: commentId,
    });
  } catch (error) {
    console.error("API DELETE /comments error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus komentar", detail: String(error) },
      { status: 500 }
    );
  }
}
