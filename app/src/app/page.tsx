"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Heart,
  Home,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PlusSquare,
  RotateCcw,
  Search,
  Send,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import useSWR from "swr";

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
  const status = statusData?.status;

  const showLatestViolation = useEffectEvent(
    (latest: {
      category?: string;
      reason?: string;
      levelAssigned?: number;
    }) => {
      setAlertPopup({
        show: true,
        category: latest.category,
        reasoning: latest.reason,
        levelAssigned: latest.levelAssigned,
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
        setAlertPopup({
          show: true,
          category: "GAGAL",
          reasoning: data.error || "Gagal mengirim komentar.",
          levelAssigned: 0,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset semua status sanksi dan riwayat pelanggaran akun ini?"))
      return;
    await fetch("/api/reset", { method: "POST" });
    mutateStatus();
    mutateComments();
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
              {getStatusBadge()}
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
            {comments.map(
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
                      <button>Balas</button>
                    </div>
                  </div>
                  <Heart className="comment-heart" />
                </article>
              ),
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
                  className="icon-button action-button"
                  aria-label="Komentar"
                >
                  <MessageCircle />
                </button>
                <button
                  className="icon-button action-button"
                  aria-label="Bagikan"
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
              </span>
            </div>
            <div className="post-date">2 AGUSTUS</div>
          </footer>

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
        </section>
      </section>

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
    </main>
  );
}
