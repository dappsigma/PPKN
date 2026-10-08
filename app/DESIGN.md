# DESIGN.md — AI Comment Moderation Demo (Social Media Feed Style)

## 1. Brand & Tone
- **Tone**: Modern, immersive, social-media-native (Instagram Reels / TikTok feed aesthetic)
- **Mood**: Dark-mode first, high contrast, cinematic, minimal chrome
- **Purpose**: Demo PPKN project — AI moderation simulation embedded in realistic social feed

## 2. Color Palette (Dark Mode Primary)
| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#09090b` (zinc-950) | App background |
| `bg-surface` | `#18181b` (zinc-900) | Cards, post containers |
| `bg-elevated` | `#27272a` (zinc-800) | Inputs, modals, hover states |
| `border-subtle` | `#3f3f46` (zinc-700) | Dividers, borders |
| `border-focus` | `#f97316` (orange-500) | Focus rings, active states |
| `text-primary` | `#fafafa` (zinc-50) | Primary text |
| `text-secondary` | `#a1a1aa` (zinc-400) | Secondary text, timestamps |
| `text-muted` | `#71717a` (zinc-500) | Placeholders, disabled |
| `accent-orange` | `#fb923c` (orange-400) | Primary actions, warnings |
| `accent-orange-hover` | `#fdba74` (orange-300) | Hover states |
| `accent-red` | `#f87171` (red-400) | Violations, destructive |
| `accent-green` | `#4ade80` (green-400) | Success, clean status |
| `accent-amber` | `#fbbf24` (amber-400) | Warning badges |

## 3. Typography
| Token | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| `display` | `Inter, system-ui` | 32px / 2rem | 700 | 1.1 |
| `heading-lg` | `Inter, system-ui` | 20px / 1.25rem | 600 | 1.3 |
| `heading-md` | `Inter, system-ui` | 16px / 1rem | 600 | 1.4 |
| `body-lg` | `Inter, system-ui` | 16px / 1rem | 400 | 1.5 |
| `body` | `Inter, system-ui` | 14px / 0.875rem | 400 | 1.5 |
| `body-sm` | `Inter, system-ui` | 13px / 0.8125rem | 400 | 1.5 |
| `caption` | `Inter, system-ui` | 12px / 0.75rem | 400 | 1.4 |
| `micro` | `JetBrains Mono, monospace` | 11px / 0.6875rem | 400 | 1.4 |
| `mono` | `JetBrains Mono, monospace` | 12px / 0.75rem | 500 | 1.3 |

## 4. Spacing Scale (4px base)
`0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64`

## 5. Border Radius
| Token | Value |
|---|---|
| `radius-sm` | 4px |
| `radius-md` | 8px |
| `radius-lg` | 12px |
| `radius-xl` | 16px |
| `radius-2xl` | 20px |
| `radius-full` | 9999px |

## 6. Shadows (Elevation)
| Token | Value |
|---|---|
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.3)` |
| `shadow-md` | `0 4px 12px rgb(0 0 0 / 0.4)` |
| `shadow-lg` | `0 12px 28px rgb(0 0 0 / 0.5)` |
| `shadow-glow` | `0 0 24px rgb(249 115 22 / 0.15)` |

## 7. Components

### Post Card (Feed Item)
- **Container**: `bg-surface`, `rounded-2xl`, `border border-subtle`, `shadow-lg`
- **Header**: Avatar (40px), Username + verified badge, timestamp, overflow menu
- **Media**: Aspect-video (16:9) or 9:16 for Reels, object-cover, rounded-t-2xl
- **Actions Row**: Like (heart), Comment (bubble), Share (paper-plane), Save (bookmark) — 48px touch targets
- **Stats**: "1,234 likes" in micro mono
- **Caption**: Username (bold) + text, expandable, hashtags in accent-orange
- **Comments Preview**: Top 2 comments, "View all N comments" link

### Comment Input (Sticky Bottom)
- **Container**: `bg-primary`, `border-t border-subtle`, `p-4`, `sticky bottom-0`
- **Avatar**: Current user (32px)
- **Input**: `bg-elevated`, `rounded-full`, `px-5 py-3`, `text-body`, placeholder "Add a comment…"
- **Send**: Icon button, `accent-orange`, disabled when empty

### Comment List Item
- **Layout**: Avatar (28px) | Content (username + text) | Time | More
- **Flagged**: Subtle red border-left, `bg-red-950/20`
- **Actions**: Reply, Like, Report (on hover)

### Status Badge (Sanction Level)
- **Level 0 (Clean)**: Green dot + "Bersih"
- **Level 1 (Warning)**: Amber badge + "Peringatan"
- **Level 2 (Mute)**: Orange badge + "Mute 15s / 24h"
- **Level 3 (Long Mute)**: Red badge + "Mute 45s / 7h"
- **Level 4 (Locked)**: Red badge + "Dikunci"

### Violation Modal
- **Backdrop**: `bg-black/70 backdrop-blur-sm`
- **Card**: `bg-surface`, `border-red-500/30`, `rounded-2xl`, `shadow-lg`
- **Icon**: ShieldAlert in red circle
- **Content**: Category badge, confidence meter, reasoning, sanction level
- **CTA**: "Saya Mengerti" — orange fill

### Sidebar (Right Rail on Desktop)
- **Account Status Card**: Avatar, username, status badge, countdown timer
- **Violation History**: Compact list, custom scrollbar, hover expand
- **Fast Test Toggle**: Switch with labels

## 8. Motion & Interaction
- **Modal enter**: `animate-in fade-in zoom-in-95 duration-200 ease-out`
- **Modal exit**: `animate-out fade-out zoom-out-95 duration-150 ease-in`
- **Comment appear**: `animate-in slide-in-from-bottom-2 fade-in duration-300`
- **Hover lift**: `transition-transform duration-150 hover:-translate-y-0.5`
- **Button press**: `active:scale-[0.97]`
- **Focus ring**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary`

## 9. Responsive Breakpoints
| Breakpoint | Layout |
|---|---|
| `< 640px` (mobile) | Single column, full-width post, sticky comment input, bottom sheet modal |
| `640–1024px` (tablet) | Centered feed max-w-md, sidebar as drawer |
| `> 1024px` (desktop) | Two-column: feed (max-w-2xl) + sidebar (w-80) |

## 10. Data Sources for Demo
- **Random Videos**: Use `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/*.mp4` (Big Buck Bunny, Elephants Dream, etc.)
- **Random Avatars**: `https://api.dicebear.com/7.x/avataaars/svg?seed={username}`
- **Usernames**: Predefined list of Indonesian-style handles
- **Captions**: Predefined Indonesian captions with hashtags

## 11. Accessibility
- Semantic HTML: `<article>` for post, `<section>` for comments, `<form>` for input
- ARIA labels on icon buttons
- Color contrast ≥ 4.5:1 (AA)
- Focus visible on all interactive elements
- Reduced motion respected via `prefers-reduced-motion`