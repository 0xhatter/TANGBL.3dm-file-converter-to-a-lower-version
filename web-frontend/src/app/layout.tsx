import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';

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
      <body className={`${GeistSans.className} ${GeistMono.variable} bg-black text-white min-h-screen relative m-0`}>
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
