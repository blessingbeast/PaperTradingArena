import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    supabaseResponse = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    supabaseResponse.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    supabaseResponse = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    supabaseResponse.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any Server Components logic here.
    // Use getUser() instead of getSession() to securely validate the session on Edge.
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';

    // Redirect authenticated users away from landing/auth pages directly to dashboard
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect dashboard routes from unauthenticated users
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (OAuth exchange)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
