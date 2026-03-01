import { TradeDashboard } from '@/components/dashboard/TradeDashboard';

export const metadata = {
    title: 'Options Trading | PaperTradingArena',
    description: 'Advanced Options Simulator with real-world SPAN margin mechanics.',
};

export default function OptionsPage() {
    return <TradeDashboard assetClass="OPT" defaultSymbol="RELIANCE" defaultLotSize={50} />;
}
