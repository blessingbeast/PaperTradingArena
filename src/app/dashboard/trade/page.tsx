import { TradeDashboard } from '@/components/dashboard/TradeDashboard';

export const metadata = {
    title: 'Trade Stocks | PaperTradingArena',
    description: 'Equities simulator with zero-latency market access.',
};

export default function TradePage() {
    return <TradeDashboard assetClass="EQ" defaultSymbol="RELIANCE" defaultLotSize={1} />;
}
