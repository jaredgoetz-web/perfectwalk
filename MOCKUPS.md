# The Perfect Walk — Screen Mockups

## 1. IMMERSIVE WALK SCREEN (During Active Walking)

Current: Scrollable page with timer, controls, now-playing, guidance toggle, volume slider, and all 5 phase cards visible.

Proposed: Full-screen immersive canvas. Nothing visible except what matters.

```
┌─────────────────────────────────┐
│                                 │
│  ○ ○ ● ○ ○     (phase dots)    │
│                                 │
│                                 │
│       ╭─────────────────╮       │
│       │                 │       │
│       │    (gradient     │       │
│       │     background   │       │
│       │     shifts per   │       │
│       │     phase color) │       │
│       │                 │       │
│       │      ♥          │       │
│       │   (large icon,  │       │
│       │    breathing,   │       │
│       │    soft glow)   │       │
│       │                 │       │
│       │  Opening Your   │       │
│       │     Heart       │       │
│       │                 │       │
│       │  "Bring your    │       │
│       │   attention to  │       │
│       │   your heart.   │       │
│       │   Breathe       │       │
│       │   into it..."   │       │
│       │                 │       │
│       │    12:34        │       │
│       │   (large timer) │       │
│       │                 │       │
│       │  ○ ○ ○ Speaking │       │
│       │  (when coach    │       │
│       │   voice active) │       │
│       │                 │       │
│       ╰─────────────────╯       │
│                                 │
│     ⏸       ⏭ Next Phase       │
│                                 │
│         ⚙ (settings icon)       │
│     (tap to reveal: music,      │
│      guidance level, volume)    │
│                                 │
│  (NO bottom nav during walk)    │
│  (NO phase card list)           │
│  (NO visible playlist info)     │
└─────────────────────────────────┘
```

Settings drawer (swipe up from ⚙):
```
┌─────────────────────────────────┐
│  ─── Settings ───────────── ✕   │
│                                 │
│  Guidance:  [Min] [Mod] [Rich]  │
│                                 │
│  Voice Volume:  ───●────  80%   │
│                                 │
│  🎵 Now playing:                │
│     Awaken Your Heart           │
│                                 │
│  🎧 Change playlist...          │
└─────────────────────────────────┘
```

## 2. PHASE TRANSITION MOMENT (2-3 seconds)

When user taps "Next Phase", instead of just swapping the icon:

```
Frame 1 (0ms): Screen fills with phase color wash
┌─────────────────────────────────┐
│                                 │
│                                 │
│    ████████████████████████     │
│    ████████████████████████     │
│    ███ warm gold wash █████     │
│    ████████████████████████     │
│    ████████████████████████     │
│                                 │
│                                 │
└─────────────────────────────────┘

Frame 2 (500ms): New phase name appears LARGE
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│      Feeling Your               │
│         Power                   │
│                                 │
│      ⚡ (icon scales in)        │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘

Frame 3 (2000ms): Shrinks to resting position
┌─────────────────────────────────┐
│  ○ ● ○ ○ ○                     │
│                                 │
│         ⚡                      │
│     (breathing glow)            │
│                                 │
│   Feeling Your Power            │
│                                 │
│   "There's a giant inside       │
│    of you. Squeeze your         │
│    fists..."                    │
│                                 │
│       12:34                     │
└─────────────────────────────────┘
```

## 3. HOME SCREEN — NEW USER (0 walks)

Current: Shows "0 days / 0 / 0" stats (demoralizing)

```
┌─────────────────────────────────┐
│                                 │
│    (hero image with gradient    │
│     overlay fading to bg)       │
│                                 │
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │  Your first walk      │    │
│    │  is waiting.          │    │
│    │                       │    │
│    │  25 minutes that will │    │
│    │  change how your      │    │
│    │  whole day feels.     │    │
│    │                       │    │
│    │  [  Start Your Walk  ]│    │
│    │    (glowing button)   │    │
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│  (NO stat cards when 0 walks)   │
│  (NO description paragraph)     │
│  (clean, inviting, simple)      │
│                                 │
│                                 │
│  Home  Walk  Journal Coach  You │
└─────────────────────────────────┘
```

## 4. HOME SCREEN — RETURNING USER (12 walks, 5-day streak)

```
┌─────────────────────────────────┐
│                                 │
│    (hero image)                 │
│                                 │
│    [ Start Your Walk ]          │
│      (glowing button)           │
│                                 │
├─────────────────────────────────┤
│                                 │
│  "I am becoming someone who     │
│   leads with love and walks     │
│   through fear."                │
│           — Day 12              │
│    (future self statement)      │
│                                 │
│  ┌────────┬────────┬────────┐   │
│  │ 🔥 5   │ 📈 12  │ ⏱ 300  │   │
│  │ day    │ walks  │ mins   │   │
│  │ streak │        │        │   │
│  └────────┴────────┴────────┘   │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 💬 Yesterday you said:    │  │
│  │ "The power was always     │  │
│  │  there, I just forgot."   │  │
│  │                           │  │
│  │  What opens today?        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🌅 Your coach:            │  │
│  │ "5 days straight. The     │  │
│  │  practice is becoming     │  │
│  │  who you are now."        │  │
│  └───────────────────────────┘  │
│                                 │
│  Home  Walk  Journal Coach  You │
└─────────────────────────────────┘
```

## 5. STREAMLINED ONBOARDING (3 screens, not 7+13)

```
Screen 1 of 3:
┌─────────────────────────────────┐
│                              ✕  │
│                                 │
│         ●○○  (progress)         │
│                                 │
│                                 │
│           ☀️                     │
│      (breathing glow)           │
│                                 │
│    The Perfect Walk             │
│                                 │
│    A formula that activates     │
│    all parts of your energetic  │
│    being and turns you into     │
│    a magnetic force.            │
│                                 │
│    Words are limiting.          │
│    Experience is limitless.     │
│                                 │
│                                 │
│    [      Let's begin      ]    │
│                                 │
│                                 │
└─────────────────────────────────┘

Screen 2 of 3:
┌─────────────────────────────────┐
│                              ✕  │
│                                 │
│         ○●○  (progress)         │
│                                 │
│    What word feels right        │
│    for the divine?              │
│                                 │
│    We'll use this during        │
│    your walk.                   │
│                                 │
│    ┌──────────┐ ┌──────────┐   │
│    │   God    │ │  Source   │   │
│    └──────────┘ └──────────┘   │
│    ┌──────────┐ ┌──────────┐   │
│    │ Universe │ │Higher Self│   │
│    └──────────┘ └──────────┘   │
│    ┌──────────┐ ┌──────────┐   │
│    │  Truth   │ │No prefer.│   │
│    └──────────┘ └──────────┘   │
│                                 │
│    [      Continue         ]    │
│                                 │
└─────────────────────────────────┘

Screen 3 of 3:
┌─────────────────────────────────┐
│                              ✕  │
│                                 │
│         ○○●  (progress)         │
│                                 │
│           ✨                     │
│      (breathing glow)           │
│                                 │
│    You're ready.                │
│                                 │
│    This walk will activate      │
│    all parts of your            │
│    energetic being.             │
│                                 │
│    The experience is where      │
│    you'll learn and grow.       │
│                                 │
│                                 │
│    [ Start My First Walk  ]     │
│                                 │
│                                 │
└─────────────────────────────────┘

(Personalization chat happens AFTER walk 1,
 not before. "Now that you've felt it,
 let me personalize your next walk.")
```

## 6. POST-WALK SYNTHESIS — FULL-SCREEN MOMENT

Current: Small italic text in a card with Skip/Save buttons.

```
┌─────────────────────────────────┐
│                                 │
│  (slow ambient gradient         │
│   background, shifting)         │
│                                 │
│                                 │
│                                 │
│         ✨                       │
│                                 │
│    Your Walk Today              │
│                                 │
│                                 │
│   "You keep coming back         │
│    to the theme of letting      │
│    go — not as weakness,        │
│    but as the bravest thing     │
│    you do. Today the giant      │
│    inside you woke up           │
│    alongside that softness.     │
│    That combination is          │
│    rare and powerful."          │
│                                 │
│   (text appears word by word    │
│    as it streams in, large      │
│    serif font, centered)        │
│                                 │
│                                 │
│                                 │
│    [    Save Reflection    ]    │
│                                 │
│    (NO skip button here —       │
│     they already answered       │
│     3 questions to get here)    │
│                                 │
└─────────────────────────────────┘
```

## 7. COACH — CONVERSATION, NOT CHATBOT

Current: Standard chat bubbles (looks like iMessage/ChatGPT)

```
┌─────────────────────────────────┐
│  ✨ Your Coach         Clear    │
├─────────────────────────────────┤
│                                 │
│  (full-width, no bubbles,       │
│   like reading a letter)        │
│                                 │
│  ───────────────────────────    │
│                                 │
│  I noticed you've been          │
│  spending more time in the      │
│  Heart phase lately. That       │
│  tells me something is          │
│  opening up.                    │
│                                 │
│  What's been on your mind       │
│  this week?                     │
│                                 │
│  (serif font, generous          │
│   line spacing, warm)           │
│                                 │
│  ───────────────────────────    │
│                                 │
│  I've been thinking about       │
│  my relationship with my        │
│  dad. Something shifted         │
│  during the walk yesterday.     │
│                                 │
│  (sans-serif, slightly          │
│   indented or different bg)     │
│                                 │
│  ───────────────────────────    │
│                                 │
│  ○ ○ ○                          │
│  (breathing dots, not           │
│   bouncing)                     │
│                                 │
├─────────────────────────────────┤
│  🎙  Say what's on your mind... │
│                     [  Send  ]  │
└─────────────────────────────────┘
```

## 8. PAYWALL — "THE INNER CIRCLE"

Shown after 4th walk attempt in a week:

```
┌─────────────────────────────────┐
│                           ✕     │
│                                 │
│           ✨                     │
│                                 │
│    Your practice is             │
│    deepening.                   │
│                                 │
│    You've walked 3 times        │
│    this week. Unlock            │
│    unlimited walks to make      │
│    this a daily ritual.         │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ★ MOST POPULAR           │  │
│  │                           │  │
│  │  Annual — $59.99/year     │  │
│  │  Just $5/month            │  │
│  │  Save 50%                 │  │
│  │                           │  │
│  │  [  Go Deeper — Annual  ] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Monthly — $9.99/month    │  │
│  │                           │  │
│  │  [  Go Deeper — Monthly ] │  │
│  └───────────────────────────┘  │
│                                 │
│  Lifetime — $149.99 one-time   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  "I built this walk for myself, │
│   then for my friends, and now  │
│   for you. Your support keeps   │
│   the coaching and music alive."│
│                       — Jared   │
│                                 │
│         Not now                 │
│                                 │
└─────────────────────────────────┘
```
