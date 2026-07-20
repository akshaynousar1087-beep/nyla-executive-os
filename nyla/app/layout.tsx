import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Nyla — Executive OS", template: "%s · Nyla" },
  description: "Akshay Noushar’s secure operating system for clients, projects, studio, finance, and executive intelligence.",
  applicationName: "Nyla",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nyla" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  openGraph: { title: "Nyla — Executive OS", description: "Think clearly. Create boldly. Move with intent.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}<script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`}} /></body></html>;
}
