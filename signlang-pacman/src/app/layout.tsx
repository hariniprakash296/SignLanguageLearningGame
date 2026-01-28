import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SignLang Pacman - Learn ASL Through Play",
  description: "A fun Pacman-style game that teaches American Sign Language. Collect letter pellets to learn ASL signs, or translate YouTube videos into sign language.",
  keywords: ["ASL", "American Sign Language", "learning game", "Pacman", "education", "sign language"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
