import { brandedPwaIcon } from '@/lib/pwa-icon';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export function GET() {
  return brandedPwaIcon(180);
}
