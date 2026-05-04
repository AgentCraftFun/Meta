import { NextResponse } from 'next/server';
import { cacheBackend } from '@/lib/cache';
import { getActiveSourceMode } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: getActiveSourceMode(),
    cache: cacheBackend(),
    timestamp: new Date().toISOString(),
  });
}
