import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalPomodoro from "@/components/GlobalPomodoro";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Terminal } from "lucide-react";

const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
});

const sans = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CodePractice | Precision Interview Preparation",
  description: "Industrial-grade interview preparation platform. Curated logic modules, company-specific question banks, and real-time progress tracking for modern engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${mono.variable} ${sans.variable} font-sans h-screen overflow-hidden bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="h-full pt-16 overflow-y-auto scroll-smooth">
            {children}
            <Footer />
          </main>
          <GlobalPomodoro />
        </ThemeProvider>
      </body>
    </html>
  );
}
