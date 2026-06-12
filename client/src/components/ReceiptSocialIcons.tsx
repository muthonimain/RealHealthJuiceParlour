import type { ReactNode } from 'react'

function SocialIcon({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      className="thermal-receipt__footer-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-label={label}
      role="img"
    >
      <circle className="thermal-receipt__footer-icon-bg" cx="12" cy="12" r="12" />
      {children}
    </svg>
  )
}

export default function ReceiptSocialIcons() {
  return (
    <span className="thermal-receipt__footer-icons" aria-hidden>
      <SocialIcon label="Facebook">
        <path
          className="thermal-receipt__footer-icon-fg"
          d="M13.6 12.1h2.2l.3-2.8h-2.5V7.8c0-.8.2-1.4 1.4-1.4h1.1V3.4c-.3 0-1.3-.1-2.4-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.5v2.8h2.3v7.2h3.8v-7.2z"
        />
      </SocialIcon>
      <SocialIcon label="Instagram">
        <rect
          className="thermal-receipt__footer-icon-fg thermal-receipt__footer-icon-stroke"
          x="7.2"
          y="7.2"
          width="9.6"
          height="9.6"
          rx="2.4"
          fill="none"
          strokeWidth="1.5"
        />
        <circle
          className="thermal-receipt__footer-icon-fg thermal-receipt__footer-icon-stroke"
          cx="12"
          cy="12"
          r="2.2"
          fill="none"
          strokeWidth="1.5"
        />
        <circle className="thermal-receipt__footer-icon-fg" cx="15.6" cy="8.4" r="0.9" />
      </SocialIcon>
      <SocialIcon label="TikTok">
        <path
          className="thermal-receipt__footer-icon-fg"
          d="M14.8 8.3c.9-.5 1.6-1.4 1.8-2.5h-2.6v8.9c0 1.8-1.5 3.3-3.3 3.3s-3.3-1.5-3.3-3.3 1.5-3.3 3.3-3.3c.3 0 .6.1.9.1V9.8c-.3 0-.6-.1-.9-.1-2.8 0-5.1 2.3-5.1 5.1s2.3 5.1 5.1 5.1 5.1-2.3 5.1-5.1V10c1 .7 2.2 1.1 3.5 1.1V8.5c-.5 0-1-.1-1.5-.2z"
        />
      </SocialIcon>
      <SocialIcon label="X">
        <path
          className="thermal-receipt__footer-icon-fg"
          d="M13.7 10.8 17.9 6h-1.5l-3.6 4.2L10.2 6H6.5l4.4 5.1L6.4 18h1.5l3.8-4.4 3.4 4.4h3.7l-4.6-5.3zm-1.3 1.5.4.6 3.2 4.6h-1.1l-2.6-3.7-.5-.7-3.2-4.6h1.1l2.6 3.8z"
        />
      </SocialIcon>
    </span>
  )
}
