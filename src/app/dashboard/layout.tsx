import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MarketTicker } from '@/components/dashboard/MarketTicker';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen relative hide-scrollbar">
                <MarketTicker />
                <div className="p-4 md:p-8 pb-20 md:pb-8">
                    {children}
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
