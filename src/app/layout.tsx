import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NotesSyncProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotesSync | AI-Powered Exam Preparation Decision Engine",
  description: "Your syllabus. Your time. Your plan. Prioritize high-impact topics for your actual available study time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50/50 text-zinc-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden w-full">
        <NotesSyncProvider>
          {children}
        </NotesSyncProvider>
      </body>
    </html>
  );
}
