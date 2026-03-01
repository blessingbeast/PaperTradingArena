import { OptionChain } from '@/components/dashboard/OptionChain';

export const metadata = {
    title: 'Option Chain | PaperTradingArena',
    description: 'Advanced options chain for Indian stocks and indices.',
};

export default function OptionChainPage() {
    return (
        <div className="h-full">
            <OptionChain />
        </div>
    );
}
