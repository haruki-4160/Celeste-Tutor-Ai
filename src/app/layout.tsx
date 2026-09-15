import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Celeste Tutor Ai",
  description: "Your interactive Socratic tutor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased bg-violet-100 dark:bg-indigo-950 transition-colors duration-300 min-h-screen selection:bg-fuchsia-300 selection:text-fuchsia-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
