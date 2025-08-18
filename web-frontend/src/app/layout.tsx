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
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
