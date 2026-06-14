import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { CookieConsent } from "@/components/legal/cookie-consent";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEYO — School Operating System",
  description:
    "Run your school's admissions, attendance, fees and academics in one calm, fast place. Built for Kenyan schools.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NEYO",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c2740",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // FOUNDER UPDATE 2026-06-13 (G.33 2.0): LIQUID GLASS is the DEFAULT
    // SYSTEM. Glass wraps both appearances: "glass" (light, default) and
    // "glass-dark". Plain light/dark remain as user fallback choices.
    // Liquidity level (data-liquid 1|2|3) is COMPANY-set via PlatformSetting,
    // cached in localStorage for pre-paint (no flash), synced after load.
    <html lang="en" className="glass" data-liquid="2" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,t=localStorage.getItem("neyo-theme");if(t==="light"){d.classList.remove("glass")}else if(t==="dark"){d.classList.remove("glass");d.classList.add("dark")}else if(t==="glass-dark"){d.classList.add("dark")}var l=localStorage.getItem("neyo-liquid");if(l==="1"||l==="2"||l==="3")d.setAttribute("data-liquid",l)}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.variable}>
        <ToastProvider>
          {children}
          <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  );
}
