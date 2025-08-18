import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/file-uploader';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-24 bg-background">
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
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">TANGBL.3dm File Downsaver</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Convert Rhino 8 and other 3DM files to lower versions (7, 6, 5, etc.) easily online.
          </p>
        </div>

        {/* Main Card */}
        <Card className="w-full border border-border/40 bg-card/50 shadow-lg">
          <CardHeader>
            <CardTitle>Convert Your 3DM Files</CardTitle>
            <CardDescription>
              Upload your .3dm file and select the target Rhino version to convert to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card className="border border-border/40 bg-card/50 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Easy Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Simply upload your .3dm file, select the target version, and download the converted file.</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/50 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Multiple Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Convert to Rhino 7, 6, 5, 4, 3, or 2 from newer versions.</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/50 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Secure Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your files are processed securely and not stored permanently on our servers.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground mt-16 pb-6">
          <p>© {new Date().getFullYear()} TANGBL.3dm File Downsaver. All rights reserved.</p>
          <p className="mt-2">Powered by the rhino3dm library.</p>
        </footer>
      </div>
    </main>
  );
}
