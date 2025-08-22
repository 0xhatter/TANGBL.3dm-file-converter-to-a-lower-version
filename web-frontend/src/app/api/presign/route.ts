import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get filename from query parameter
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
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

    // Forward request to microservice
    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/presign?filename=${encodeURIComponent(filename)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: `Upstream error (${upstream.status}): ${text || upstream.statusText}` },
        { status: 502 }
      );
    }

    // Return the presigned URL data
    const presignedData = await upstream.json();
    return NextResponse.json(presignedData);
  } catch (error) {
    console.error('Proxy error during presign request:', error);
    return NextResponse.json({ error: 'Failed to get presigned URL' }, { status: 500 });
  }
}
