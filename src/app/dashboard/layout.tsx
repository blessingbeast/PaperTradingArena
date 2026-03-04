import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MarketTicker } from '@/components/dashboard/MarketTicker';
import { TopDirectoryNav } from '@/components/layout/TopDirectoryNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 flex flex-col min-h-screen relative hide-scrollbar">
                <MarketTicker />
                <TopDirectoryNav />
                <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
