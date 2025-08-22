import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploader } from '@/components/file-uploader'

export const metadata = {
  title: 'Rhino 8 to Rhino 6 File Converter Online',
  description: 'Convert Rhino 8 .3dm files to Rhino 6 online. Fast, secure, and free. Supports large files via S3 upload.'
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-10 lg:p-20">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">Rhino 8 to Rhino 6 File Converter (Online)</h1>
          <p className="text-white/70">Downsave any Rhino 8 .3dm file to Rhino 6 in your browser. No permanent storage.</p>
        </header>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-md shadow-xl rounded-md">
          <CardHeader>
            <CardTitle>Convert Rhino 8 → Rhino 6</CardTitle>
            <CardDescription className="text-white/70">Upload your .3dm file and choose Rhino 6 as the target version.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Why downsave from Rhino 8 to 6?</h2>
          <p className="text-white/70">Share models with teams or plugins that still use Rhino 6. Our converter preserves geometry and helps keep workflows compatible.</p>
          <p className="text-white/70">Need another conversion? Try <Link className="underline" href="/rhino-7-to-6">Rhino 7 → 6</Link> or <Link className="underline" href="/rhino-6-to-5">Rhino 6 → 5</Link>.</p>
        </section>
      </div>
    </main>
  )
}
