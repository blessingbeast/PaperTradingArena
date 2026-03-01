import type { Metadata } from 'next';
import Home from '@/app/page';

export const metadata: Metadata = {
    title: "PaperTrading India - Free Futures & Options Simulator",
    description: "Learn stock trading in India with real NSE/BSE data. Practice options buying and selling risk-free on PaperTradingArena.",
};

export default function PaperTradingIndiaPage() {
    return <Home />;
}
