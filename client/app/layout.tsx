import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Mengoptimalkan pemuatan font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Metadata untuk SEO dan branding platform
export const metadata: Metadata = {
  title: "AI Quiz Platform | Real-time Interactive Experience",
  description: "Generate and play interactive quizzes powered by AI in real-time.",
  keywords: ["AI Quiz", "Realtime Quiz", "Interactive Learning", "Kahoot Clone"],
};

// Viewport sangat penting untuk aplikasi kuis agar tidak 'zoom' otomatis saat input di mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          bg-slate-50 
          text-slate-900 
          selection:bg-blue-100 
          selection:text-blue-900
        `}
      >
        {/* Main wrapper menggunakan flex-col untuk memastikan konten 
          selalu berada di tengah namun tetap scrollable jika konten panjang 
        */}
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}