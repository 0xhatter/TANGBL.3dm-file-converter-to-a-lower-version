import './globals.css'
import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TANGBL.3dm File Downsaver",
  description: "Convert Rhino 3DM files to lower versions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen relative font-mono`}>
        {/* Background image (add your file to /public/bg.jpg) */}
        <div className="fixed inset-0 -z-50 bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat" />
        {/* Soft vignette overlay for readability */}
        <div className="fixed inset-0 -z-40 pointer-events-none bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        {/* Content */}
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
