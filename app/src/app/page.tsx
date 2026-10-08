"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Heart,
  Home,
  Lock,
  Menu,
  MessageCircle,
  MessageCircleOff,
  MessageSquareOff,
  MoreHorizontal,
  PlusSquare,
  Repeat2,
  RotateCcw,
  Search,
  Send,
  Smile,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import useSWR from "swr";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const post = {
  id: "post_1",
  creator: {
    username: "Bernadya",
    name: "Edukasi PPKN Nasional",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  caption:
    "Mari wujudkan ruang digital Indonesia yang santun, beretika, dan bebas dari cyberbullying! Setiap kata mencerminkan kepribadian bangsa. 🇮🇩 #PPKN #LiterasiDigital #SadarHukum",
};

const slides = Array.from(
  { length: 8 },
  (_, index) => `/media/${index + 1}.jpg`,
);
const emojis = [
  "😂",
  "❤️",
  "🔥",
  "🙌",
  "😍",
  "😭",
  "👏",
  "🥹",
  "😮",
  "💯",
  "🤍",
  "👍",
];

export default function HomePage() {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showCommentsList, setShowCommentsList] = useState(true);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [alertPopup, setAlertPopup] = useState<{
    show: boolean;
    category?: string;
    reasoning?: string;
    levelAssigned?: number;
  }>({ show: false });
  const lastSeenHistoryCount = useRef(0);

  const { data: commentsData, mutate: mutateComments } = useSWR(
    "/api/comments",
    fetcher,
    {
      refreshInterval: 3000,
    },
  );
  const { data: statusData, mutate: mutateStatus } = useSWR(
    "/api/reset",
    fetcher,
    {
      refreshInterval: 1000,
    },
  );

  const comments = commentsData?.comments || [];
  const commentsOpen = commentsData?.commentsOpen ?? true;
  const status = statusData?.status;

  const handleToggleCommentsOpen = async () => {
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentsOpen: !commentsOpen }),
      });
      if (res.ok) {
        await mutateComments();
      }
    } catch (err) {
      console.error("Gagal toggle status komentar:", err);
    } finally {
      setShowPostOptions(false);
    }
  };

  const handleToggleCommentsList = () => {
    setShowCommentsList((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => commentInputRef.current?.focus(), 120);
      }
      return nextState;
    });
    setShowPostOptions(false);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteComment = async (commentId: string) => {
    const result = await Swal.fire({
      title: "Hapus Komentar?",
      text: "Komentar ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ed4956",
      cancelButtonColor: "#363636",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      background: "#212328",
      color: "#f5f5f5",
    });
    if (!result.isConfirmed) return;

    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mutateComments();
        Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: "Komentar berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
          background: "#212328",
          color: "#f5f5f5",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: data.error || "Gagal menghapus komentar.",
          confirmButtonColor: "#ed4956",
          background: "#212328",
          color: "#f5f5f5",
        });
      }
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllComments = async () => {
    const result = await Swal.fire({
      title: "Hapus Semua Komentar?",
      text: "Semua komentar pada postingan ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ed4956",
      cancelButtonColor: "#363636",
      confirmButtonText: "Ya, Hapus Semua",
      cancelButtonText: "Batal",
      background: "#212328",
      color: "#f5f5f5",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/comments?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        mutateComments();
        setShowPostOptions(false);
        Swal.fire({
          icon: "success",
          title: "Semua Komentar Terhapus",
          timer: 1800,
          showConfirmButton: false,
          background: "#212328",
          color: "#f5f5f5",
        });
      }
    } catch (err) {
      console.error("Gagal menghapus semua komentar:", err);
    }
  };

  // ==========================================
  // FITUR REPOST ALA INSTAGRAM
  // ==========================================
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(1248);
  const [quoteNote, setQuoteNote] = useState("");
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedRepost = localStorage.getItem("ppkn_reposted");
      if (savedRepost === "true") {
        setIsReposted(true);
        setRepostCount(1249);
        const savedQuote = localStorage.getItem("ppkn_quote") || "";
        setQuoteNote(savedQuote);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  const handleInstantRepost = () => {
    setIsReposted(true);
    setRepostCount((prev) => (isReposted ? prev : prev + 1));
    setQuoteNote("");
    setShowRepostSheet(false);
    try {
      localStorage.setItem("ppkn_reposted", "true");
      localStorage.removeItem("ppkn_quote");
    } catch {}
    showToast("Diposting ulang ke profil Anda");
  };

  const handleQuoteRepostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteInput.trim()) return;
    setIsReposted(true);
    if (!isReposted) {
      setRepostCount((prev) => prev + 1);
    }
    setQuoteNote(quoteInput.trim());
    try {
      localStorage.setItem("ppkn_reposted", "true");
      localStorage.setItem("ppkn_quote", quoteInput.trim());
    } catch {}
    setShowQuoteModal(false);
    setShowRepostSheet(false);
    setQuoteInput("");
    showToast("Diposting ulang dengan catatan Anda");
  };

  const handleUndoRepost = () => {
    setIsReposted(false);
    setRepostCount((prev) => Math.max(1248, prev - 1));
    setQuoteNote("");
    setShowRepostSheet(false);
    try {
      localStorage.removeItem("ppkn_reposted");
      localStorage.removeItem("ppkn_quote");
    } catch {}
    showToast("Postingan ulang telah dihapus");
  };

  const showLatestViolation = useEffectEvent(
    (latest: {
      category?: string;
      reason?: string;
      levelAssigned?: number;
    }) => {
      Swal.fire({
        icon: "warning",
        title: "Peringatan Etika Digital",
        html: `
          <div style="text-align: left; background: rgba(255, 190, 85, 0.08); border: 1px solid rgba(255, 190, 85, 0.25); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #ffbe55;">
              Kategori: ${latest.category || "Pelanggaran Etika"}
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.45; color: #e5e7eb;">
              ${latest.reason || "Komentar terdeteksi mengandung unsur yang tidak pantas."}
            </p>
          </div>
          ${
            latest.levelAssigned
              ? `<div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: rgba(237, 73, 86, 0.15); border: 1px solid rgba(237, 73, 86, 0.35); border-radius: 999px; color: #ff727c; font-size: 13px; font-weight: 700;">
                  <span>⚠️ Tingkat Sanksi: Level ${latest.levelAssigned}</span>
                 </div>`
              : ""
          }
        `,
        confirmButtonText: "Saya Mengerti",
        confirmButtonColor: "#ed4956",
        background: "#212328",
        color: "#f5f5f5",
      });
    },
  );

  useEffect(() => {
    const count = status?.historyCount ?? 0;
    if (count > lastSeenHistoryCount.current && status?.history?.length) {
      showLatestViolation(status.history[0]);
    }
    lastSeenHistoryCount.current = count;
  }, [status?.historyCount, status?.history]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, postId: post.id }),
      });
      const data = await response.json();

      if (response.ok && !data.error) {
        setCommentText("");
        mutateComments();
        mutateStatus();
      } else {
        Swal.fire({
          icon: "error",
          title: "Komentar Belum Terkirim",
          text: data.error || "Gagal mengirim komentar.",
          confirmButtonText: "Tutup",
          confirmButtonColor: "#ed4956",
          background: "#212328",
          color: "#f5f5f5",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: "Reset Status Akun?",
      text: "Semua riwayat pelanggaran dan sanksi akun ini akan dihapus dan dikembalikan ke kondisi awal.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0095f6",
      cancelButtonColor: "#363636",
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal",
      background: "#212328",
      color: "#f5f5f5",
    });
    if (!result.isConfirmed) return;

    await fetch("/api/reset", { method: "POST" });
    mutateStatus();
    mutateComments();
    Swal.fire({
      icon: "success",
      title: "Status Direset",
      text: "Status akun Anda telah kembali aman.",
      timer: 1800,
      showConfirmButton: false,
      background: "#212328",
      color: "#f5f5f5",
    });
  };

  const moveSlide = (direction: number) => {
    setActiveSlide((current) =>
      Math.max(0, Math.min(slides.length - 1, current + direction)),
    );
  };

  const getStatusBadge = () => {
    if (!status) return null;
    if (status.isRestricted)
      return <span className="status-badge status-danger">Dibatasi</span>;
    if (status.isMuted)
      return (
        <span className="status-badge status-warning">
          Muted ({status.timeRemaining})
        </span>
      );
    if (status.level === 1)
      return <span className="status-badge status-warning">Peringatan</span>;
    return <span className="status-badge status-safe">Aman</span>;
  };

  return (
    <main className="instagram-shell">
      <nav className="instagram-sidebar" aria-label="Navigasi utama">
        <a className="wordmark" href="#home" aria-label="Instagram">
          Instagram
        </a>
        <div className="sidebar-links">
          <button aria-label="Beranda">
            <Home />
          </button>
          <button aria-label="Cari">
            <Search />
          </button>
          <button aria-label="Jelajahi">
            <Compass />
          </button>
          <button aria-label="Reels">
            <Clapperboard />
          </button>
          <button aria-label="Pesan">
            <Send />
          </button>
          <button aria-label="Notifikasi">
            <Heart />
          </button>
          <button aria-label="Buat postingan">
            <PlusSquare />
          </button>
          <button aria-label="Profil">
            <UserRound />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button aria-label="Menu">
            <Menu />
          </button>
          <button aria-label="Lainnya">
            <MoreHorizontal />
          </button>
        </div>
      </nav>

      <button className="modal-close" aria-label="Tutup">
        <X />
      </button>

      <section className="post-modal" aria-label="Detail postingan">
        <div className="post-media">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((src, index) => (
              <div className="carousel-slide" key={src}>
                <img
                  src={src}
                  alt={`Foto ${index + 1} dari postingan ${post.creator.name}`}
                />
              </div>
            ))}
          </div>
          {activeSlide > 0 && (
            <button
              className="carousel-arrow carousel-previous"
              onClick={() => moveSlide(-1)}
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft />
            </button>
          )}
          {activeSlide < slides.length - 1 && (
            <button
              className="carousel-arrow carousel-next"
              onClick={() => moveSlide(1)}
              aria-label="Foto berikutnya"
            >
              <ChevronRight />
            </button>
          )}
          <div
            className="carousel-dots"
            aria-label={`Foto ${activeSlide + 1} dari ${slides.length}`}
          >
            {slides.map((src, index) => (
              <button
                key={src}
                className={index === activeSlide ? "active" : ""}
                onClick={() => setActiveSlide(index)}
                aria-label={`Lihat foto ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <section className="post-details">
          {isReposted && (
            <div className="repost-banner">
              <Repeat2 className="repost-banner-icon" />
              <span>
                Anda memposting ulang
                {quoteNote && <em> · "{quoteNote}"</em>}
              </span>
            </div>
          )}
          <header className="post-header">
            <div className="avatar-ring">
              <img src={post.creator.avatar} alt="" />
            </div>
            <div className="post-identity">
              <span className="username">{post.creator.username}</span>
              <BadgeCheck
                className="verified-badge"
                aria-label="Terverifikasi"
              />
              <span className="identity-separator">·</span>
              <button
                className="follow-button"
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Mengikuti" : "Ikuti"}
              </button>
            </div>
            <div className="post-tools">
              {!commentsOpen && (
                <span className="status-badge status-closed">Komentar Ditutup</span>
              )}
              {getStatusBadge()}
              <button
                className={`icon-button toggle-comments-btn ${!commentsOpen ? "is-closed" : ""}`}
                onClick={handleToggleCommentsOpen}
                aria-label={commentsOpen ? "Tutup fitur komentar" : "Buka fitur komentar"}
                title={commentsOpen ? "Tutup Komentar (Nonaktifkan)" : "Buka Komentar (Aktifkan)"}
              >
                {commentsOpen ? <MessageCircle /> : <MessageSquareOff />}
              </button>
              <button
                className="icon-button"
                onClick={handleReset}
                aria-label="Reset status moderasi"
                title="Reset status moderasi"
              >
                <RotateCcw />
              </button>
              <button
                className="icon-button more-button"
                onClick={() => setShowPostOptions(true)}
                aria-label="Opsi lainnya"
              >
                <MoreHorizontal />
              </button>
            </div>
          </header>

          <div className="comments-list">
            <article className="comment-row caption-row">
              <div className="avatar-ring avatar-small">
                <img src={post.creator.avatar} alt="" />
              </div>
              <div className="comment-content">
                <p>
                  <span className="username">{post.creator.username}</span>
                  <BadgeCheck
                    className="verified-badge"
                    aria-label="Terverifikasi"
                  />{" "}
                  {post.caption}
                </p>
                <div className="comment-meta">
                  <span>9 mgg</span>
                  <button>Terjemahkan</button>
                </div>
              </div>
            </article>

            {!showCommentsList ? (
              <div className="comments-hidden-placeholder">
                <MessageCircleOff className="hidden-icon" />
                <p className="hidden-title">Daftar komentar disembunyikan</p>
                <p className="hidden-desc">
                  Komentar disembunyikan untuk kenyamanan tampilan. Klik tombol di bawah untuk membukanya.
                </p>
                <button
                  type="button"
                  className="show-comments-btn"
                  onClick={() => {
                    setShowCommentsList(true);
                    setTimeout(() => commentInputRef.current?.focus(), 120);
                  }}
                >
                  Buka Komentar ({comments.length})
                </button>
              </div>
            ) : (
              <>
                <div className="comments-header-bar">
                  <span>Komentar ({comments.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowCommentsList(false)}
                    className="toggle-view-text-btn"
                    title="Sembunyikan daftar komentar"
                  >
                    Tutup Tampilan
                  </button>
                </div>

                {!commentsOpen && (
                  <div className="comments-notice-closed">
                    <Lock />
                    <span>Fitur komentar telah dinonaktifkan oleh pemilik postingan.</span>
                  </div>
                )}

                {comments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    Belum ada komentar. Jadilah yang pertama berkomentar!
                  </div>
                ) : (
                  comments.map(
                    (item: {
                      id: string;
                      accountId: string;
                      text: string;
                      flagged?: boolean;
                      category?: string;
                      review?: string;
                    }) => (
                      <article
                        className={`comment-row ${item.flagged ? "comment-flagged" : ""}`}
                        key={item.id}
                      >
                        <div className="avatar-fallback">
                          {item.accountId.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="comment-content">
                          <p>
                            <span className="username">
                              pengguna_{item.accountId.slice(0, 6)}
                            </span>{" "}
                            {item.text}
                          </p>
                          <div className="comment-meta">
                            <span>
                              {item.review === "pending" ? "Meninjau" : "Baru saja"}
                            </span>
                            {item.flagged && (
                              <span className="flag-label">AI: {item.category}</span>
                            )}
                            <button type="button">Balas</button>
                            <button
                              type="button"
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(item.id)}
                              disabled={deletingId === item.id}
                              title="Hapus komentar ini"
                            >
                              {deletingId === item.id ? "Menghapus..." : "Hapus"}
                            </button>
                          </div>
                        </div>
                        <div className="comment-side-actions">
                          <button
                            type="button"
                            className="comment-trash-action"
                            onClick={() => handleDeleteComment(item.id)}
                            title="Hapus komentar"
                            aria-label="Hapus komentar"
                            disabled={deletingId === item.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="comment-heart-btn"
                            aria-label="Suka komentar"
                          >
                            <Heart className="comment-heart" />
                          </button>
                        </div>
                      </article>
                    ),
                  )
                )}
              </>
            )}
          </div>

          <footer className="post-footer">
            <div className="post-actions">
              <div className="action-group">
                <button
                  className={`icon-button action-button ${isLiked ? "liked" : ""}`}
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label={isLiked ? "Batal suka" : "Suka"}
                  aria-pressed={isLiked}
                >
                  <Heart />
                </button>
                <button
                  className={`icon-button action-button ${showCommentsList ? "text-[#0095f6]" : ""}`}
                  onClick={handleToggleCommentsList}
                  aria-label={showCommentsList ? "Tutup tampilan komentar" : "Buka tampilan komentar"}
                  title={showCommentsList ? "Tutup tampilan komentar" : "Buka tampilan komentar"}
                >
                  {showCommentsList ? <MessageCircle /> : <MessageCircleOff />}
                </button>
                <button
                  className={`icon-button action-button ${isReposted ? "reposted" : ""}`}
                  onClick={() => setShowRepostSheet(true)}
                  aria-label={isReposted ? "Opsi posting ulang" : "Posting ulang"}
                  title={isReposted ? "Diposting ulang (Klik untuk opsi)" : "Posting ulang (Repost)"}
                >
                  <Repeat2 />
                </button>
                <button
                  className="icon-button action-button"
                  aria-label="Bagikan"
                  onClick={() => setShowRepostSheet(true)}
                >
                  <Send />
                </button>
              </div>
              <button
                className={`icon-button action-button ${isSaved ? "saved" : ""}`}
                onClick={() => setIsSaved(!isSaved)}
                aria-label={isSaved ? "Hapus tersimpan" : "Simpan"}
                aria-pressed={isSaved}
              >
                <Bookmark />
              </button>
            </div>
            <div className="likes-line">
              <span className="likes-avatars">
                <i>t</i>
                <i>w</i>
              </span>
              <span>
                Disukai <b>tannrap</b> dan{" "}
                <b>{isLiked ? "598.001" : "598 ribu"} lainnya</b>
                <span className="repost-stat"> · <b>{repostCount.toLocaleString()}</b> Repost</span>
              </span>
            </div>
            <div className="post-date">2 AGUSTUS</div>
          </footer>

          {!commentsOpen ? (
            <div className="comment-closed-state">
              <div className="closed-left">
                <Lock className="closed-icon" />
                <span className="closed-text">
                  Komentar telah dinonaktifkan untuk postingan ini.
                </span>
              </div>
              <button
                type="button"
                className="reopen-comment-btn"
                onClick={handleToggleCommentsOpen}
                title="Buka kembali fitur komentar"
              >
                Buka Komentar
              </button>
            </div>
          ) : (
            <form className="comment-form" onSubmit={handleSubmit}>
              {showEmojis && (
                <div className="emoji-tray">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCommentText((current) => current + emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                className="icon-button emoji-button"
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                aria-label="Pilih emoji"
              >
                <Smile />
              </button>
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                disabled={status && !status.canComment}
                placeholder={
                  status && !status.canComment
                    ? "Akun tidak dapat berkomentar"
                    : "Tambahkan komentar..."
                }
                maxLength={2200}
                aria-label="Tulis komentar"
              />
              <button
                className={`submit-comment ${commentText.trim() ? "visible" : ""}`}
                type="submit"
                disabled={
                  !commentText.trim() ||
                  isSubmitting ||
                  (status && !status.canComment)
                }
              >
                {isSubmitting ? "Mengirim..." : "Kirim"}
              </button>
            </form>
          )}
        </section>
      </section>

      {showPostOptions && (
        <div
          className="options-backdrop"
          role="presentation"
          onClick={() => setShowPostOptions(false)}
        >
          <div
            className="options-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`options-item ${commentsOpen ? "danger-text" : "primary-text"}`}
              onClick={handleToggleCommentsOpen}
            >
              {commentsOpen ? (
                <>
                  <MessageSquareOff className="w-4 h-4 mr-2" />
                  Tutup Komentar (Nonaktifkan)
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Buka Komentar (Aktifkan)
                </>
              )}
            </button>

            <button
              className="options-item"
              onClick={handleToggleCommentsList}
            >
              {showCommentsList ? (
                <>
                  <MessageCircleOff className="w-4 h-4 mr-2" />
                  Sembunyikan Daftar Komentar
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Tampilkan Daftar Komentar
                </>
              )}
            </button>

            {comments.length > 0 && (
              <button
                className="options-item danger-text"
                onClick={handleDeleteAllComments}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Semua Komentar ({comments.length})
              </button>
            )}

            <button
              className="options-item"
              onClick={() => {
                setShowPostOptions(false);
                handleReset();
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Status Akun
            </button>

            <button
              className="options-item cancel-item"
              onClick={() => setShowPostOptions(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {alertPopup.show && (
        <div className="alert-backdrop" role="presentation">
          <section
            className="alert-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
          >
            <div className="alert-mark">!</div>
            <h2 id="alert-title">
              {alertPopup.category === "GAGAL"
                ? "Komentar belum terkirim"
                : "Peringatan Etika"}
            </h2>
            <p>{alertPopup.reasoning}</p>
            {alertPopup.levelAssigned ? (
              <span className="alert-level">
                Level sanksi {alertPopup.levelAssigned}
              </span>
            ) : null}
            <button onClick={() => setAlertPopup({ show: false })}>
              Saya mengerti
            </button>
          </section>
        </div>
      )}

      {/* Instagram Repost Action Sheet Modal */}
      {showRepostSheet && (
        <div
          className="options-backdrop"
          role="presentation"
          onClick={() => setShowRepostSheet(false)}
        >
          <div
            className="options-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {!isReposted ? (
              <>
                <button
                  className="options-item repost-highlight-text"
                  onClick={handleInstantRepost}
                >
                  <Repeat2 className="w-4 h-4 mr-2" />
                  Posting Ulang Sekarang
                </button>
                <button
                  className="options-item"
                  onClick={() => {
                    setShowRepostSheet(false);
                    setQuoteInput("");
                    setShowQuoteModal(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Posting Ulang dengan Catatan
                </button>
              </>
            ) : (
              <button
                className="options-item danger-text"
                onClick={handleUndoRepost}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Postingan Ulang
              </button>
            )}
            <button
              className="options-item cancel-item"
              onClick={() => setShowRepostSheet(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Quote Repost Modal */}
      {showQuoteModal && (
        <div
          className="options-backdrop"
          role="presentation"
          onClick={() => setShowQuoteModal(false)}
        >
          <form
            className="quote-modal-card"
            onSubmit={handleQuoteRepostSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quote-modal-header">
              <Repeat2 className="w-5 h-5 text-[#00ba7c]" />
              <h3>Posting Ulang dengan Catatan</h3>
            </div>
            <p className="quote-modal-desc">
              Bagikan pemikiran atau pesan edukasi Anda mengenai postingan PPKN ini ke profil Anda.
            </p>
            <textarea
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              placeholder="Tuliskan pemikiran atau pesan Anda..."
              maxLength={280}
              rows={3}
              autoFocus
              className="quote-textarea"
            />
            <div className="quote-modal-footer">
              <button
                type="button"
                className="quote-cancel-btn"
                onClick={() => setShowQuoteModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!quoteInput.trim()}
                className="quote-submit-btn"
              >
                Posting Ulang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instagram Floating Toast */}
      {toastMessage && (
        <div className="ig-toast">
          <div className="ig-toast-content">
            <Check className="w-4 h-4 text-[#00ba7c]" />
            <span>{toastMessage}</span>
          </div>
          {isReposted && (
            <button
              type="button"
              className="ig-toast-undo"
              onClick={handleUndoRepost}
            >
              Urungkan
            </button>
          )}
        </div>
      )}
    </main>
  );
}

