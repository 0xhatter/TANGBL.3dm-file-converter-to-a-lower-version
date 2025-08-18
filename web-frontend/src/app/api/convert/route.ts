import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetVersion = formData.get('targetVersion') as string | null;

    if (!file || !targetVersion) {
      return NextResponse.json(
        { error: 'File and target version are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.CONVERTER_API_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Server not configured: CONVERTER_API_URL is missing' },
        { status: 500 }
      );
    }

    // Rebuild multipart form to forward to microservice
    const forwardForm = new FormData();
    forwardForm.append('file', file, file.name);
    forwardForm.append('targetVersion', targetVersion);

    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/convert`, {
      method: 'POST',
      body: forwardForm,
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: `Upstream error (${upstream.status}): ${text || upstream.statusText}` },
        { status: 502 }
      );
    }

    // Stream the upstream response back to the client
    const headers = new Headers(upstream.headers);
    // Ensure no caching and pass through content-disposition for download filename
    headers.set('Cache-Control', 'no-store');
    return new NextResponse(upstream.body as ReadableStream<Uint8Array> | null, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error during conversion:', error);
    return NextResponse.json({ error: 'Failed to convert file' }, { status: 500 });
  }
}
