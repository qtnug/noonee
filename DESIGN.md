---
version: alpha
name: ‎Apple Music
description: "A light interface extracted from ‎Apple Music accented with #192028, with a 1px spacing system and a -apple-system type stack."
sourceUrl: "https://music.apple.com/in/new"

colors:
  text: "#000000"
  accent: "#ebddc8"
  primary: "#192028"
  surface: "#f6f6f6"
  background: "#f1f1f1"
  on-primary: "#ffffff"
  text-muted: "#ffffff"

typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple Color Emoji, SF Pro, SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.29
  heading:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple Color Emoji, SF Pro, SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.33
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple Color Emoji, SF Pro, SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.25

spacing:
  base: 1px
  scale: [1, 2, 4, 6, 8, 10, 12, 14, 15, 20]

radius:
  lg: 7px
  md: 5px
  sm: 4px
  xl: 50px
  pill: 9999px

shadows:
  card: "rgba(0, 0, 0, 0.01) 0px 1px 1px 0px, rgba(0, 0, 0, 0.01) 0px 2px 2px 0px, rgba(0, 0, 0, 0.02) 0px 4px 4px 0px, rgba(0, 0, 0, 0.03) 0px 8px 8px 0px, rgba(0, 0, 0, 0.03) 0px 14px 14px 0px"
  elevated: "rgba(0, 0, 0, 0.01) 0px 1px 1px 0px, rgba(0, 0, 0, 0.01) 0px 2px 2px 0px, rgba(0, 0, 0, 0.02) 0px 4px 4px 0px, rgba(0, 0, 0, 0.03) 0px 8px 8px 0px, rgba(0, 0, 0, 0.03) 0px 14px 14px 0px"

motion:
  duration-fast: 100ms
  duration-base: 250ms
  duration-slow: 250ms
  easing: "ease-in"

breakpoints: [320px, 415px, 484px, 607px, 739px, 740px, 767px, 980px, 1000px, 1260px, 1320px, 1580px, 1680px, 1940px, 2000px, 2561px]
---

## Rationale

Measured design tokens extracted from https://music.apple.com/in/new. The frontmatter above is the design system — real colors, type scale, spacing, radius, shadows, motion, and breakpoints read from the live page. Upgrade to Pro for the full written system (rationale, component guidance, and accessibility notes).
