import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://3dm-file-downsaver.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TANGBL .3dm File Downsaver | Convert Rhino 3DM to Lower Versions (7, 6, 5...)',
    template: '%s | TANGBL .3dm File Downsaver'
  },
  description: 'Free online Rhino .3dm file converter. Downsave Rhino 8 files to Rhino 7, 6, 5, 4, 3, or 2. Fast, secure, no permanent storage.',
  keywords: ['rhino', '3dm', 'rhino 3d', 'downsave', 'convert 3dm', 'rhino 8 to 7', 'rhino file converter', 'rhino save as older version'],
  authors: [{ name: 'TANGBL' }],
  creator: 'TANGBL',
  applicationName: 'TANGBL .3dm File Downsaver',
  manifest: '/site.webmanifest',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'TANGBL .3dm File Downsaver',
    title: 'Convert Rhino 3DM to Lower Versions (7, 6, 5...)',
    description: 'Downsave Rhino .3dm files online. Convert Rhino 8 to older versions quickly and securely.',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'TANGBL .3dm File Downsaver' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Tangbl3',
    creator: '@Tangbl3',
    title: 'TANGBL .3dm File Downsaver',
    description: 'Convert Rhino .3dm files to lower versions online (7, 6, 5...).',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
        <Analytics />
        {/* JSON-LD: Organization & SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'TANGBL',
                  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://3dm-file-downsaver.vercel.app',
                  sameAs: ['https://x.com/Tangbl3'],
                  logo: {
                    '@type': 'ImageObject',
                    url: '/logo.png'
                  }
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'TANGBL .3dm File Downsaver',
                  applicationCategory: 'Utility',
                  operatingSystem: 'Web',
                  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://3dm-file-downsaver.vercel.app',
                  description:
                    'Convert Rhino .3dm files to lower versions online (7, 6, 5, 4, 3, 2). Fast, secure, no permanent storage.',
                  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
                }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
