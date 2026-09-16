import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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
    <html lang="en">
      <body className="antialiased bg-violet-100 dark:bg-indigo-950 transition-colors duration-300 min-h-screen selection:bg-fuchsia-300 selection:text-fuchsia-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
