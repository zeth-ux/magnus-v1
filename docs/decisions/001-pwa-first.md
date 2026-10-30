# 001: PWA first, native later (only when triggered)

- **Date:** 2026-10-30
- **Status:** Accepted
- **Decided by:** Zarith (after debating iOS-native vs PWA with Claude)

## Context
Magnus is a book swap + book club community app for Malaysia (KL first) and
possibly Ansan/Seoul. The question: build a **web app (PWA)** or a **native
iOS app** first?

My first instinct was iOS: apps feel more memorable, more "real", and more
interesting to build.

## Options considered

| | PWA (Next.js) | Native iOS (Swift) | Expo / React Native (iOS + Android) |
|---|---|---|---|
| Cost to start | ~RM0 (Vercel + Supabase free tiers) | US$99/yr Apple developer fee + Mac or cloud builds (I'm on Windows) | US$99/yr Apple + US$25 one-time Google Play; cloud builds, no Mac needed |
| Who can use it | Anyone with a browser | iPhone only | iPhone + Android |
| Time to first real user | Days | Weeks (new language, App Review) | 1-2 weeks |
| Shipping fixes | Instant | App Review | App Review (OTA updates for JS changes) |
| Arrives via shared link | 1 tap | Store → install → sign up → find the thing again | Same as iOS |
| Push notifications | Android: yes. iPhone: only after "Add to Home Screen" (iOS 16.4+) | Yes | Yes |
| Portfolio | Clickable link | TestFlight invite | Store links |

## Why PWA wins *for now*
1. **iOS-only excludes most users.** StatCounter, Sept 2026 (share of web
   traffic, which over-counts iPhone): Malaysia Android 55% / iOS 45%;
   South Korea Android 62% / iOS 38%. A swap app is a two-sided network, so
   cutting out half the users cuts the chance of a match by *more* than half.
2. **Growth is link-driven.** Users come from Facebook groups, WhatsApp and
   KakaoTalk. A link that opens straight into a meetup page beats a store detour.
3. **The idea isn't validated yet.** "Talk to 5-10 users" is still undone.
   Make the cheapest thing that can prove people want it.
4. **Career fit.** Web, APIs and Postgres carry over to AI software engineering
   more directly than Swift does.
5. **The interesting engineering doesn't depend on the platform:** swap-cycle
   matching (graph cycles), geo search, recommendations.

## What I gave up (honestly)
- Reliable push on iPhone, a home-screen icon by default, and App Store
  credibility. These help **retention**, which matters once there are users.

## Triggers to go native
Revisit when **any** of these happens:
- ~200 weekly active users, or
- users say they miss swap requests or event reminders because there are no notifications, or
- book clubs ask for "the app".

When triggered, build with **Expo (React Native)** for iOS and Android
together, not iOS-only.

## Consequences for how we build now
- Mobile-first design, installable PWA (manifest + service worker), "Add to
  Home Screen" prompt after a user's first successful swap or RSVP.
- All business logic lives in Supabase (RLS, SQL functions) and API routes,
  not in React components, so a future native app is just a new front end.
- Barcode scanning via a JS library (e.g. ZXing). Safari has no native
  BarcodeDetector API.
- Email + web push for notifications, and WhatsApp share links for events.
