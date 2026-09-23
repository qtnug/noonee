'use client';

import React from 'react';

/**
 * Honeypot Scraper Trap
 * Completely invisible and inert to human users, but present in HTML for automated
 * web scrapers, rogue spiders and malicious crawlers to catch them.
 */
export default function HoneypotTrap() {
  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        left: '-99999px',
        top: '-99999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        visibility: 'hidden',
      }}
    >
      <a href="/api/honeypot-trap" rel="nofollow" tabIndex={-1} aria-hidden="true">
        NooNee Internal Directory - Automated Crawlers Trap
      </a>
    </div>
  );
}
