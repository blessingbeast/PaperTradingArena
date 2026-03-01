import { TradeDashboard } from '@/components/dashboard/TradeDashboard';

export const metadata = {
    title: 'Futures Trading | PaperTradingArena',
    description: 'High leverage Futures trading simulator with live Indian market data.',
};

export default function FuturesPage() {
    return <TradeDashboard assetClass="FUT" defaultSymbol="RELIANCE" defaultLotSize={50} />;
}
