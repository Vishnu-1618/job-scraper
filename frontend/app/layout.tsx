import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import NavbarClient from "@/components/NavbarClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "JobRadar AI — Find Your Dream Job",
  description: "Discover thousands of jobs from LinkedIn, Indeed, Glassdoor & Naukri. AI-powered job matching made simple.",
  keywords: "job search, jobs, careers, linkedin jobs, indeed, glassdoor, naukri, AI job matching",
};

import CursorGlow from "@/components/CursorGlow";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <CursorGlow />
        <NavbarClient />
        {children}
      </body>
    </html>
  );
}
