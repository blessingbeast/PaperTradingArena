'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LineChart, Binary, BarChart3, ListTree } from 'lucide-react';

export function TopDirectoryNav() {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard/trade', label: 'Stocks', icon: LineChart },
        { href: '/dashboard/futures', label: 'Futures', icon: Binary },
        { href: '/dashboard/options', label: 'Options', icon: BarChart3 },
        { href: '/dashboard/options/chain', label: 'Option Chain', icon: ListTree },
    ];

    return (
        <div className="bg-card border-b px-4 py-3 flex gap-6 overflow-x-auto hide-scrollbar z-10 relative shadow-sm">
            {links.map((link) => {
                const isActive = pathname === link.href || (link.href === '/dashboard/trade' && pathname === '/dashboard');
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-colors relative pb-1",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                        {isActive && (
                            <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
