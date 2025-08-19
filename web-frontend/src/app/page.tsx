import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/file-uploader';
import LiquidGlassBanner from '@/components/liquid-glass-banner';
import { Upload, Layers, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Header region: fixed-position logos + centered banner container */}
      <div className="relative w-full mt-[8px]">
        {/* Logos (kept exactly the same classes/positions) */}
        <Link href="https://x.com/Tangbl3" target="_blank" rel="noopener noreferrer" className="absolute top-3 left-3 z-30 inline-flex items-center md:top-4 md:left-4" aria-label="TANGBL on X">
          <Image
            src="/logo.png"
            alt="TANGBL Logo"
            width={38}
            height={38}
            priority
            className="opacity-90 hover:opacity-100 transition rounded shadow-sm"
          />
        </Link>
        {/* Secondary logo on the top-right, same visual size */}
        <Link href="https://x.com/Tangbl3" target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 z-30 inline-flex items-center md:top-4 md:right-4" aria-label="TANGBL on X">
          <Image
            src="/logo1.png"
            alt="TANGBL Secondary Logo"
            width={38}
            height={38}
            priority
            className="opacity-90 hover:opacity-100 transition rounded shadow-sm"
          />
        </Link>

        {/* Centered, constrained banner width with 8px inner gutter */}
        <div className="w-full max-w-[1350px] mx-auto px-2">
          <LiquidGlassBanner height={70} speedPxPerSec={14} text="Xperience Reality" />
        </div>
      </div>

      <main className="flex min-h-screen flex-col items-center p-6 md:p-10 lg:p-20">
      <div className="max-w-5xl w-full space-y-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-widest"> .3dm FILE DOWNSAVER by TANGBL</h1>
          </div>
          <p className="text-lg text-white/70 max-w-2xl">
            Convert Rhino 8 and other 3DM files to lower versions (7, 6, 5, etc.) easily online.
          </p>
        </div>

        {/* Main Card - glassmorphic */}
        <Card className="w-full border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
          <CardHeader>
            <CardTitle className="tracking-widest">CONVERT YOUR 3DM FILES</CardTitle>
            <CardDescription className="text-white/60">
              Upload your .3dm file and select the target Rhino version to convert to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <Upload className="w-5 h-5 text-white/90" />
              <CardTitle className="tracking-widest">EASY CONVERSION</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Simply upload your .3dm file, select the target version, and download the converted file.</p>
            </CardContent>
          </Card>
          <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <Layers className="w-5 h-5 text-white/90" />
              <CardTitle className="tracking-widest">MULTIPLE VERSIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Convert to Rhino 7, 6, 5, 4, 3, or 2 from newer versions.</p>
            </CardContent>
          </Card>
          <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-white/90" />
              <CardTitle className="tracking-widest">SECURE PROCESSING</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Your files are processed securely and not stored permanently on our servers.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/60 mt-16 pb-6">
          <p>© {new Date().getFullYear()} Powered by TANGBL</p>
          <p className="mt-2"></p>
        </footer>
      </div>
      </main>
    </>
  );
}
