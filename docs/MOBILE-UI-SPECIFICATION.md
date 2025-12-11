# FaithConnect Mobile UI Design Proposal
## Enterprise-Grade Professional Design System

---

## 1. Design Philosophy & Principles

### Core Philosophy
**"Sacred Simplicity"** – Enterprise-grade functionality wrapped in familiar, reverent interface patterns. The UI should feel as trustworthy as a church community and as intuitive as the apps users already love.

### Guiding Principles
1. **Familiar First**: WhatsApp-style navigation (tabs), Telegram's advanced features, Facebook's feed richness – reimagined for faith context
2. **Progressive Disclosure**: Show complexity only when needed; default to clarity
3. **Accessibility as Foundation**: WCAG 2.1 AA is minimum, not aspiration
4. **Faith-Native UX**: Bible verses, prayer, and spiritual content are first-class citizens, not bolt-ons
5. **Safety-Visible**: Moderation and privacy controls are conspicuous and confidence-inspiring

---

## 2. Design System

### Color Palette
**Primary**: Deep Sanctuary Blue `#0A1F3D` (trust, stability)
**Secondary**: Warm Gold `#D4A574` (hope, light)
**Accent**: Prayer Purple `#6B5B95` (spirituality)
**Semantic**:
- Success: Covenant Green `#2E7D32`
- Warning: Testament Amber `#F57C00`
- Error: Redemption Red `#C62828`
- Info: Heavenly Blue `#1976D2`

**Neutral Grays**:
- Background: `#F8F9FA`
- Surface: `#FFFFFF`
- Border: `#E0E0E0`
- Text Primary: `#212121`
- Text Secondary: `#757575`

### Typography
**Display**: Noto Serif (serif for headlines, verse quotes) – conveys reverence
**Body**: Inter (sans-serif for UI) – maximizes readability
**Monospace**: JetBrains Mono (for verse references, code)

**Scale**:
- H1: 28px (Profile name)
- H2: 22px (Section headers)
- H3: 18px (Card titles)
- Body: 16px (Primary text)
- Caption: 14px (Metadata)
- Small: 12px (Timestamps)

### Iconography
- **Style**: Outlined Icons (Material Design 3 baseline) with custom faith-specific icons
- **Faith Icons**: Cross, Bible, Praying Hands, Church, Halo (verified badge), Dove
- **Sizing**: 24px (standard), 32px (feature), 48px (empty states)

### Spacing & Grid
- **Base Unit**: 8px
- **Margins**: 16px horizontal (mobile-safe area)
- **Card Padding**: 16px
- **Border Radius**: 12px (cards), 24px (buttons), 8px (inputs)
- **Elevation**: 0, 1, 2, 4, 8 dp shadows (subtle, never harsh)

---

## 3. Navigation Architecture

### Bottom Tab Navigation (WhatsApp-style)
**5 Primary Tabs** (always visible):

| Tab | Icon | Label | Core Purpose |
|-----|------|-------|--------------|
| **Feed** | `home` | Home | Facebook-style feed with edification scoring |
| **Chat** | `message` | Chats | WhatsApp-style messaging with prayer meeting integration |
| **Bible** | `book` | Bible | Dedicated scripture reader with study tools |
| **Prayer** | `hands-praying` | Prayer | Quiet Time journal + Community Prayer Wall |
| **Groups** | `users` | Groups | Telegram-style group management |

**Secondary Navigation**: Top tabs within each primary tab for sub-sections (e.g., Feed > Primary/Discovery/Prayer-Priority)

### Global UI Elements
- **Header**: 56px height, blurred background, contains title + primary actions
- **Floating Action Button (FAB)**: Gold accent (+) – context-aware creation (post, message, prayer, verse note)
- **Search**: Persistent in header with swipe-down gesture (like Telegram)
- **Profile Avatar**: Circular, 40px, top-right corner – taps to quick profile/settings menu

---

## 4. Key Screen Designs

### 4.1 Auth & Onboarding (WhatsApp Pattern)

**Screen 1: Welcome**
- Full-bleed hero image (soft church interior/cross)
- Centered logo + tagline: "Connect in Faith"
- Primary CTA: "Start with Phone Number" (gold button, 48px height)
- Secondary: "Data Recovery via Email" (subtle link)
- Age gate: Native date picker (minimum age 13) before enabling CTA

**Screen 2: Phone Input**
- Country code dropdown (auto-detect) + phone input
- Real-time validation with green checkmark
- "Next" button becomes active only when valid
- OTP auto-read from SMS (Android) / SMS fill suggestion (iOS)

**Screen 3: OTP Verification**
- 6-digit code input with automatic focus advancement
- 60-second countdown timer
- "Resend Code" appears after countdown
- Loader state: "Verifying..." with faith-themed spinner (cross rotating)

**Screen 4: Community Guidelines**
- Full-screen modal with scrollable content
- Highlights: Love, Respect, Truth, Safety (with icon headers)
- Bottom sticky action: "I Agree & Continue" (disabled until scroll to bottom)
- Timestamp recorded on button press

**Screen 5: Profile Creation**
- Profile photo: Circular placeholder with camera icon (tap for capture/crop)
- Display Name: Input with real-time character counter (50 max)
- Bio: Optional, 160 char limit
- Denomination: Searchable dropdown (Catholic, Baptist, Methodist, etc.)
- Interests: Multi-select chips (Prayer, Bible Study, Worship, Youth Ministry, Missions)
- Church: Optional, location-aware search

---

### 4.2 Feed Screen (Facebook-inspired)

**Header**:
- "FaithConnect" logo left
- Search icon (magnifier) center-right
- Profile avatar (40px) rightmost

**Top Tabs** (Material 3 primary indicator):
- **Primary** (default): Chronological + bump logic
- **Discovery**: Edification Score algorithm
- **Prayer Priority**: Prayer requests and urgent needs
- **Friends**: Connections-only content

**Post Composer** (Card at top):
- User avatar + "Share your faith..." text input (taps expand)
- Quick action row: Photo/Video, Verse Picker, Live Prayer button (when streaming)

**Post Card**:
```
┌─────────────────────────────────────┐
│ [Avatar] Name          [⋮] Menu     │
│ @handle • 2h ago • [Earth|Friends]  │
├─────────────────────────────────────┤
│ Post text with #hashtags and        │
│ @mentions. Rich verse card embed.   │
│                                     │
│ [Verse Card: John 3:16 NIV]         │
│ "For God so loved the world..."     │
│ ── 2,340 faith reactions            │
├─────────────────────────────────────┤
│ [🙏 Pray] [❤️ Amen] [✨ Praise]      │
│ [💬 Comment] [↗️ Share] [🔖 Save]    │
│ 42 comments • 12 shares             │
└─────────────────────────────────────┘
```

**Interactions**:
- **Faith Reactions**: Long-press to reveal 6 emoji: 🙏 Pray, ❤️ Amen, ✨ Praise, 🕊️ Peace, 🔥 Fire (passion), 😢 Comfort
- **Verse Card**: Tap to expand, swipe for parallel translations, long-press to highlight
- **Comments**: Nested up to 3 levels, indent visually; "View 12 more replies" button
- **Share**: Bottom sheet with options: Repost with comment, Send in chat, Copy link, Save to collection

**Empty States**: Gentle illustrations (praying hands, open Bible) with encouraging copy

---

### 4.3 Chat Screen (WhatsApp + Telegram Hybrid)

**Chat List Item**:
```
┌─────────────────────────────────────┐
│ [Avatar] Name            [Time]     │
│ [Preview] You: Great verse! 🙏     │
│ [Badge] 3  [Muted|Pinned icon]      │
└─────────────────────────────────────┘
```

**Conversation Screen**:
- **Header**: Avatar, name, status (online/last seen/praying), verification badge, call/video icons
- **Message Bubble**:
  - **Sent**: Pale gold background, dark text
  - **Received**: White background, dark text
  - **E2EE**: Small lock icon adjacent to timestamp
- **Replies**: Tap-and-hold to reply; shows quoted message snippet above bubble
- **Forwards**: "Forwarded" label + original sender attribution
- **Voice Notes**: Waveform visualization with play/pause, 2x speed option
- **File Send**: Compresses images/video; shows progress bar; S3 upload status

**Group Chat (≤1,000 members – Telegram pattern)**:
- **Header**: Group avatar, name, member count
- **Admin Controls**: Pin messages, mute members, assign roles in group info
- **Roles Badge**: "Host", "Co-host", "Music Host" appear in member list and message headers
- **Announcement Mode**: Only admins can post (toggle in settings)

**Live Prayer Meeting Integration** (Agora-powered):
- **Active Meeting Bar**: Persistent banner at top of chat list: "🔴 Live: Morning Prayer with Pastor Mike"
- **Join Flow**: Tap bar → Role selection (if public) → Join meeting
- **In-Meeting Chat**: Separate tab from video ("Chat" | "Participants")

---

### 4.4 Live Prayer Meeting Screen (Unique Innovation)

**Stage Layout** (Up to 2,500 participants):
```
┌─────────────────────────────────────┐
│ [X] Morning Prayer  [Recording ⏺️] │
│ 247 participants  [⋮] Menu          │
├─────────────────────────────────────┤
│  [Host Avatar]  LARGE VIDEO         │
│  Pastor Mike (Host)                 │
│                                     │
│  [Speaker Avatar] SMALL VIDEO        │
│  Sarah (Speaker)                    │
│                                     │
│  [Music Host] AUDIO ONLY INDICATOR  │
│  David (Music Host) 🎵              │
├─────────────────────────────────────┤
│  [Mic] [Cam] [Hand] [Share] [Leave] │
│                                     │
│  💬 Chat  👥 Participants (247)     │
│  ─────────────────────────────────  │
│  [Chat messages...]                 │
└─────────────────────────────────────┘
```

**Role-Specific Controls**:

| Role | Available Controls |
|------|-------------------|
| **Listener** | Mute/Unmute self, Camera on/off, Raise Hand, React (🙏❤️), Leave |
| **Speaker** | All listener controls + Spotlight request |
| **Co-host** | Mute/unmute others, Remove participant, Lock meeting, Assign speaker/music host |
| **Music Host** | Play/Pause/Stop audio, Volume slider, Track queue, Share audio to stage (persists) |
| **Host** | Full controls + Start/Stop Recording, Breakout rooms (premium), End meeting |

**Audio Sharing Flow**:
- Music Host taps "Play Audio" → File picker or URL input → Audio plays for all
- New joiners hear audio from beginning (sync state maintained)
- Visual indicator: Floating music note with track name below stage

**Recording Indicator**: Red pulsing dot + "Recording to Cloud" text; auto-uploads to S3

**Network Adaption**: Auto-quality badge shows in corner (HD → SD → Audio Only)

---

### 4.5 Bible Reader Screen (P0 Excellence)

**Header**:
- Book/Chapter navigation (dropdowns, like Kindle)
- Translation switcher (NIV, ESV, NASB, etc.) – sticky setting
- Search icon, parallel view toggle

**Reading Area**:
- Verse numbers: Subtle gray, superscript
- **Verse Actions**: Long-press any verse → Contextual toolbar:
  - Highlight (5 color options: Yellow, Blue, Pink, Green, Purple)
  - Bookmark (star)
  - Add Note (pencil)
  - Share (verse card generator)
  - Verse Image (auto-generates shareable graphic)

**Parallel View**: Split screen; swipe to sync verses; different translations side-by-side

**TTS Controls**: Floating mini-player: Play/Pause, Speed (0.5x - 2x), Voice selection

**Search Results**: `<500ms` local search; highlights matches; filters by OT/NT/Book

**Study Tools** (Premium):
- **Cross-References**: Tap verse → "Related" tab shows linked passages
- **Commentaries**: Bottom sheet with excerpt; tap to expand full commentary
- **Lexicon** (P2): Tap Greek/Hebrew word → Popover with definition

**Reading Plans**:
- Progress ring on Bible tab icon
- Plan card: "Day 23 of 40: Patience in Trials"
- Streak counter: Flame icon + number (top of screen)
- Reminder: Bell icon with time setting

---

### 4.6 Quiet Time (Personal Spiritual Hub)

**Journal Screen**:
```
┌─────────────────────────────────────┐
│ Quiet Time • [Date]  [Streak 🔥23]  │
├─────────────────────────────────────┤
│ [Template Selector]  [Mood Picker]  │
│                                     │
│ [Rich Text Editor]                  │
│ "What is God teaching              │
│ me today?"                         │
│                                     │
│ [Verse Embed: tap to search]       │
│ [Image Gallery: ≤5 images]         │
│                                     │
│ Tags: #gratitude #healing          │
└─────────────────────────────────────┘
```

**Mood Picker**: 8 emoji faces + custom note field

**Prayer List**:
- List items: Prayer text, urgency (🔴🟡🟢), days posted
- Swipe actions: Left = Mark Prayed (✅), Right = Edit
- "Answered" section: Grayed out with "Praise God!" badge

**Community Prayer Wall**:
- Toggle: Anonymous / Named (default: Anonymous)
- Post composer: "Prayer Request" with category chips (Healing, Guidance, Family, etc.)
- Prayer card: 🙏 Pray button (increments count), Comments disabled for anonymous posts
- Answered flag: Green "Answered ✓" badge with praise comment thread

---

### 4.7 Groups (Telegram-style Power)

**Group Types**:
- **Public**: Searchable, open join
- **Private**: Invite/link only
- **Secret**: Hidden, not searchable, invite-only (for sensitive support groups)

**Group Info Screen**:
```
┌─────────────────────────────────────┐
│ [Large Avatar] Group Name           │
│ 247 members • 12 online             │
│                                     │
│ 📅 Next Event: Youth Night         │
│ 🔔 3 announcements                  │
├─────────────────────────────────────┤
│ Role: Admin [Manage Group]         │
│                                     │
│ Tabs: About | Media | Members |     │
│        Events | Resources           │
└─────────────────────────────────────┘
```

**Member List**: Shows role badges, online status, "Add to Chat" quick action

**Announcements**: Pinned posts with megaphone icon; push notification to all members

**Events**: RSVP with "Going/Maybe/Not Going"; integrates with device calendar

---

### 4.8 Creator Marketplace (Professional E-commerce)

**Browse Screen**:
- Hero carousel: Featured album/resource pack
- Category tabs: Music, Study Guides, Devotionals, Art
- Filter: Price, Rating, Denomination, Format
- Product card: Cover art, title, creator name, rating, price

**Product Detail**:
```
┌─────────────────────────────────────┐
│ [Album Art]  Title: "Hope Rising"  │
│ Creator: @worshipleader ✓          │
│ ⭐ 4.9 (234) • $9.99                │
│                                     │
│ [Preview Player: 30s clips]        │
│ Tracklist: 12 songs                 │
│                                     │
│ [License Terms] • [Denomination]   │
│                                     │
│ [💳 Purchase] [🎁 Gift]             │
└─────────────────────────────────────┘
```

**Creator Dashboard**:
- Revenue chart (Stripe Connect data)
- Payout status: "Next payout: Dec 15"
- Product performance: Views, Purchases, Revenue per item
- Upload flow: Metadata form, copyright declaration, preview generation

---

## 5. Component Specifications

### 5.1 Verse Card Component
**Props**: `reference`, `translation`, `text`, `reactionCount`, `onPress`
**Behavior**: 
- Tap: Expand to show parallel translations
- Long-press: Highlight or share as image
- Swipe: Deep link to full chapter
**Styling**: Cream background, left border gold, serif font

### 5.2 Prayer Meeting Participant Tile
**Props**: `user`, `role`, `audioLevel`, `isSpeaking`
**Visuals**:
- Speaking indicator: Blue ring pulse around avatar
- Music Host: Musical note badge
- Host: Crown badge
- Audio level: Animated bars below avatar

### 5.3 Edification Score Badge
**Display**: Subtle chip on post card
**Color**: Gold when ≥7.0, gray when <5.0
**Tooltip**: "This post encourages spiritual growth" (tap to see breakdown)

### 5.4 Bottom Sheet Patterns
- **Half-screen**: Post composer, reaction picker, share menu
- **Full-screen**: Bible commentaries, Group member management
- **Dismiss**: Swipe down or tap scrim

---

## 6. Accessibility & Localization

### Accessibility Features
- **Screen Readers**: All icons labeled; images have alt text; dynamic type support
- **Text Scaling**: Supports up to 200% system font size; layouts reflow gracefully
- **Contrast**: All text meets WCAG AA (4.5:1); interactive elements AAA (7:1)
- **Motor**: 44px minimum tap targets; swipe gestures have button alternatives
- **Voice Control**: Custom labels for all interactive elements

### Localization
- **RTL Support**: Mirror layouts for Arabic, Hebrew
- **String Management**: `.arb` files per locale; avoid concatenation
- **Date/Time**: Relative ("2 hours ago") + absolute; 12/24h format
- **Currency**: Localized pricing in marketplace (Stripe support)

---

## 7. Dark Mode
- **Background**: `#121212`
- **Surface**: `#1E1E1E`
- **Primary**: Muted gold `#B8935F`
- **Text**: High-emphasis `#FFFFFF`, medium `#B3B3B3`
- **Verse Cards**: Dark cream `#2C2A26`
- **Prayer Meeting**: Video backgrounds remain true; UI overlays are semi-transparent

---

## 8. Implementation Phases (UI-Aligned)

### **Phase 1 (Months 1-4)**
- **Foundation**: Design system tokens, component library in Storybook
- **P0 UI**: Auth flow (phone OTP), Profile, Feed (text/image), Chat (DM), Groups (basic), Bible (5 versions), Push notifications, Admin UI v1
- **Metrics**: Cold start <2s, feed load <2s on 4G

### **Phase 2 (Months 5-8)**
- **Rich Media**: Video posts, Live Prayer UI (audio→video), Edification Score UI, Prayer Wall, Reading Plans, Creator Marketplace browse/purchase
- **Premium Features**: Badges, advanced Bible study UI, Chat search
- **Polish**: Micro-interactions, empty states, error boundaries

### **Phase 3 (Months 9-12)**
- **Advanced Creator**: Ads portal, analytics dashboards, promotional tools
- **Premium Features**: Breakout rooms UI, advanced analytics, export flows
- **Scale**: Performance optimization, offline mode core flows, RTL implementation

---

## 9. Design Deliverables

1. **Figma Design System**: Components, variants, auto-layout, variables (theming)
2. **Interactive Prototype**: Principal user flows (auth → first post → join prayer)
3. **UI Spec Sheets**: Redlines for all components, spacing, typography scales
4. **Motion Guidelines**: 200ms ease-out for micro-interactions, sheet transitions
5. **Icon Library**: 200+ custom icons in 24×24, 32×32, 48×48 (SVG)
6. **Illustration Kit**: 20+ empty state illustrations (style: gentle, inclusive)

---

## 10. Success Metrics

- **Task Completion Rate**: >95% for core flows (post, prayer, chat)
- **Time-to-First-Post**: <3 minutes from OTP verification
- **Accessibility Audit**: 0 critical/serious issues (axe Core >95%)
- **User Satisfaction**: NPS >50 (faith-based community benchmark)
- **Engagement**: Daily active prayer meeting participants >30% of DAUs

---

This design system balances enterprise rigor with spiritual warmth, delivering a professional experience that feels both cutting-edge and eternally trustworthy.

