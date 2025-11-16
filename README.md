<!--
  README.md for Code-Zone
  - Copy everything in this single code block and paste into your README.md
  - NOTE: GitHub strips some <style> tags and JS in README rendering for security.
    Animated images (SVG/gifs) and external badges will render fine. If you want
    full CSS-driven animations, consider GitHub Pages or your project's site.
-->

<!-- ========================================================= -->
<!-- 🌟 GLOWING ANIMATED HEADER BANNER -->
<!-- ========================================================= -->

<p align="center">
  <img alt="Waving banner" src="https://capsule-render.vercel.app/api?type=waving&color=0:4f46e5,100:9333ea&height=230&section=header&text=CODE-ZONE&fontSize=64&fontColor=ffffff&animation=twinkling&fontAlignY=40" />
</p>

<p align="center">
  <img alt="Animated tagline" src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=28&duration=2600&pause=1200&color=A855F7&center=true&vCenter=true&width=820&lines=Unleash+Creativity;Build+Seamlessly;Inspire+Innovation;Bring+Forgotten+Projects+Back+to+Life" />
</p>

---

<!-- ========================================================= -->
<!-- ✨ Quick badges -->
<!-- ========================================================= -->

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/Status-Active-9333ea?style=for-the-badge" />
  <img alt="version" src="https://img.shields.io/badge/Version-1.0.0-a855f7?style=for-the-badge" />
  <img alt="license" src="https://img.shields.io/badge/License-MIT-6ee7b7?style=for-the-badge" />
  <img alt="made-with" src="https://img.shields.io/badge/Made%20with-React%20%2B%20TS-4f46e5?style=for-the-badge" />
</p>

---

<!-- ========================================================= -->
<!-- 🎨 THEME + STYLES (best-effort; GitHub may strip CSS tags) -->
<!-- ========================================================= -->

<style>
/* NOTE: GitHub README pages often strip <style> for security.
   For full CSS experience, use the README on GitHub Pages or include this in a docs site.
*/

.cz-hero {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
  margin-bottom: 12px;
}

/* icon grid animations */
.cz-icons {
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  justify-content:center;
  align-items:center;
  margin-top: 10px;
}

/* neon-hover (best effort) */
.neon {
  display:inline-block;
  filter: drop-shadow(0 0 6px rgba(165, 85, 247, .55));
  transition: transform 220ms ease, filter 220ms ease;
  border-radius: 10px;
  padding: 6px;
}
.neon:hover {
  transform: translateY(-6px) scale(1.06);
  filter: drop-shadow(0 0 18px rgba(165, 85, 247, .95));
  transition: transform 220ms cubic-bezier(.2,.9,.3,1), filter 220ms;
}

/* staged fade-ins */
@keyframes softFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.staged-1 { animation: softFadeIn .6s ease .0s both; }
.staged-2 { animation: softFadeIn .6s ease .15s both; }
.staged-3 { animation: softFadeIn .6s ease .30s both; }
.staged-4 { animation: softFadeIn .6s ease .45s both; }

/* bouncing magic for CTA */
@keyframes gentlePulse {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.cta {
  display:inline-block;
  padding: 10px 18px;
  border-radius: 999px;
  background: linear-gradient(90deg,#7c3aed,#06b6d4);
  color: white;
  text-decoration:none;
  font-weight:600;
  animation: gentlePulse 3.6s ease-in-out infinite;
  box-shadow: 0 8px 30px rgba(124,58,237,.12);
}
</style>

---

## 📦 About Code-Zone

<p align="center" class="cz-hero staged-1">
  <strong style="font-size:1.05rem">A modern, fast, and playful <code>React + TypeScript + Vite</code> project — revived and reimagined.</strong>
  <span style="color:#6b7280">Bringing forgotten projects back to life — with motion, polish, and developer joy ✨</span>
</p>

---

## 🔥 Tech Stack (with badges & animated icons)

<p align="center" class="cz-icons staged-2">
  <!-- core tech -->
  <span class="neon"><img alt="TypeScript" src="https://skillicons.dev/icons?i=ts" height="48"/></span>
  <span class="neon"><img alt="JavaScript" src="https://skillicons.dev/icons?i=js" height="48"/></span>
  <span class="neon"><img alt="React" src="https://skillicons.dev/icons?i=react" height="48"/></span>
  <span class="neon"><img alt="Vite" src="https://skillicons.dev/icons?i=vite" height="48"/></span>
  <span class="neon"><img alt="Tailwind" src="https://skillicons.dev/icons?i=tailwind" height="48"/></span>
  <span class="neon"><img alt="Node" src="https://skillicons.dev/icons?i=nodejs" height="48"/></span>

  <!-- extras -->
  <span class="neon"><img alt="Appwrite" src="https://img.shields.io/badge/Appwrite-FF52A0?style=flat-square&logo=appwrite&logoColor=white" height="34"/></span>
  <span class="neon"><img alt="TanStack Query" src="https://img.shields.io/badge/TanStack%20Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" height="34"/></span>
  <span class="neon"><img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white" height="34"/></span>
</p>

<p align="center" class="staged-3" style="color:#6b7280;margin-top:8px">
  <em>Appwrite for backend, TanStack Query for data fetching, and shadcn/ui for beautiful primitives.</em>
</p>

---

## 📚 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Tech & Animations](#tech--animations)
- [Missing Features (Planned)](#missing-features-planned)
- [Contributing](#contributing)
- [License](#license)

---

## 🧭 Overview

Code-Zone is a starter/full-stack-ish front-end project scaffolded with Vite, TypeScript and React — extended with UI primitives, data fetching patterns, and modern developer ergonomics. It focuses on:

- Developer experience (fast HMR, readable structure)
- Visual polish (animated README, icons, banners)
- Extendability (Appwrite-ready backend, TanStack Query for caching, shadcn/ui for components)

---

## 🏁 Getting Started

### 🔧 Prerequisites

- Node.js (>= 18 recommended)
- npm or pnpm
- (Optional) Appwrite instance for backend features

---

### 📥 Installation

```bash
# 1. Clone this repo
git clone https://github.com/AmierKhalid/Code-Zone.git
cd Code-Zone

# 2. Install dependencies
npm install
# or
# pnpm install

# 3. Start the dev server
npm run dev

# 4. Build for production
npm run build

# 5. Preview the production build
npm run preview
