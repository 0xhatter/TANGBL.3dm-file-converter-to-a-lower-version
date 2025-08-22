import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/file-uploader'

export const metadata = {
  title: 'Rhino 6 to Rhino 5 File Converter Online',
  description: 'Convert Rhino 6 .3dm files to Rhino 5 online. Fast, secure, and free. Supports large files via S3 upload.'
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-10 lg:p-20">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">Rhino 6 to Rhino 5 File Converter (Online)</h1>
          <p className="text-white/70">Downsave Rhino 6 .3dm files to Rhino 5 for legacy workflows and plugin compatibility.</p>
        </header>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
          <CardHeader>
            <CardTitle>Convert Rhino 6 → Rhino 5</CardTitle>
            <CardDescription className="text-white/70">Upload your .3dm and choose Rhino 5 as the target version.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Stay compatible</h2>
          <p className="text-white/70">Keep collaborating with teams and toolchains that still rely on Rhino 5. Quick, secure, and simple.</p>
          <p className="text-white/70">Need different versions? Try <Link className="underline" href="/rhino-8-to-6">Rhino 8 → 6</Link> or <Link className="underline" href="/rhino-7-to-6">Rhino 7 → 6</Link>.</p>
        </section>
      </div>
    </main>
  )
}
