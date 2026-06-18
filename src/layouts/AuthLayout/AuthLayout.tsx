import type { ReactNode } from "react";
import brandMark from "../../assets/auth/brand-mark.svg";
import "./AuthLayout.scss";

type HeroOverlayVariant = "brand" | "dim";

interface AuthLayoutProps {
  brandName: string;
  children: ReactNode;
  description: string;
  heroImageSrc: string;
  overlayVariant?: HeroOverlayVariant;
  title: string;
}

export function AuthLayout({
  brandName,
  children,
  description,
  heroImageSrc,
  overlayVariant = "brand",
  title,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-layout-intro" aria-label="Platform introduction">
        <img
          className="auth-layout-image"
          src={heroImageSrc}
          alt=""
          aria-hidden
        />
        <div
          className={`auth-layout-overlay auth-layout-overlay--${overlayVariant}`}
          aria-hidden="true"
        />

        <div className="auth-layout-content">
          <div className="auth-brand">
            <img className="auth-brand-icon" src={brandMark} alt="" />
            <h2>{brandName}</h2>
          </div>

          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="auth-layout-panel" aria-label="Admin login form">
        {children}
      </section>
    </main>
  );
}