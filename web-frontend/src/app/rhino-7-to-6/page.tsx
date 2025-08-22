import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/file-uploader'

export const metadata = {
  title: 'Rhino 7 to Rhino 6 File Converter Online',
  description: 'Convert Rhino 7 .3dm files to Rhino 6 online. Fast, secure, and free. Supports large files via S3 upload.'
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-10 lg:p-20">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">Rhino 7 to Rhino 6 File Converter (Online)</h1>
          <p className="text-white/70">Downsave Rhino 7 .3dm files to Rhino 6 directly in your browser.</p>
        </header>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
          <CardHeader>
            <CardTitle>Convert Rhino 7 → Rhino 6</CardTitle>
            <CardDescription className="text-white/70">Upload your .3dm and select Rhino 6 as the target version.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Compatibility made easy</h2>
          <p className="text-white/70">Ensure teams using Rhino 6 can open your Rhino 7 models without friction. Geometry-first, simple workflow.</p>
          <p className="text-white/70">Also see <Link className="underline" href="/rhino-8-to-6">Rhino 8 → 6</Link> and <Link className="underline" href="/rhino-6-to-5">Rhino 6 → 5</Link>.</p>
        </section>
      </div>
    </main>
  )
}
