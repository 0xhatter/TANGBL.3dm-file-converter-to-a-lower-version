import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/file-uploader';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-10 lg:p-20">
      <div className="max-w-5xl w-full space-y-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center space-x-3">
            <Image 
              src="/file.svg" 
              alt="TANGBL Logo" 
              width={56} 
              height={56} 
              className="invert"
            />
            <h1 className="text-3xl md:text-5xl font-bold tracking-widest">TANGBL . 3DM FILE DOWNSAVER</h1>
          </div>
          <p className="text-lg text-white/70 max-w-2xl">
            Convert Rhino 8 and other 3DM files to lower versions (7, 6, 5, etc.) easily online.
          </p>
        </div>

        {/* Main Card */}
        <Card className="w-full border border-white/20 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
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
          <Card className="border border-white/15 bg-black/30 shadow-none">
            <CardHeader>
              <CardTitle className="tracking-widest">EASY CONVERSION</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Simply upload your .3dm file, select the target version, and download the converted file.</p>
            </CardContent>
          </Card>
          <Card className="border border-white/15 bg-black/30 shadow-none">
            <CardHeader>
              <CardTitle className="tracking-widest">MULTIPLE VERSIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Convert to Rhino 7, 6, 5, 4, 3, or 2 from newer versions.</p>
            </CardContent>
          </Card>
          <Card className="border border-white/15 bg-black/30 shadow-none">
            <CardHeader>
              <CardTitle className="tracking-widest">SECURE PROCESSING</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">Your files are processed securely and not stored permanently on our servers.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-white/60 mt-16 pb-6">
          <p>© {new Date().getFullYear()} TANGBL.3dm File Downsaver</p>
          <p className="mt-2">Powered by rhino3dm</p>
        </footer>
      </div>
    </main>
  );
}
