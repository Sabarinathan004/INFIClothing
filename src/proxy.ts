import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - icon, apple-icon
     * - public files (icons, manifest, sw)
     * - api routes for PDF generation (need to be publicly accessible for sharing)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
