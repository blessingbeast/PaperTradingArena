import type { Metadata } from 'next';
import Home from '@/app/page';

export const metadata: Metadata = {
    title: "Free Paper Trading - Zero Risk Trading Platform",
    description: "Start free paper trading with ₹10 Lakh virtual capital. Test your strategies on stocks, futures and options on PaperTradingArena.",
};

export default function FreePaperTradingPage() {
    return <Home />;
}
