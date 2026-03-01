import type { Metadata } from 'next';
import Home from '@/app/page';

export const metadata: Metadata = {
    title: "Best Paper Trading Simulator 2026 - PaperTradingArena",
    description: "The most realistic paper trading simulator for beginners. Features live delays, F&O support, and automated trading journals.",
};

export default function PaperTradingSimulatorPage() {
    return <Home />;
}
