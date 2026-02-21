
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart, History, PieChart, Users, Smartphone } from 'lucide-react';

export default function FeaturesPage() {
    const features = [
        {
            title: "Real-Time Simulation",
            description: "Experience the market with delayed data from NSE. Prices update automatically.",
            icon: TrendingUp
        },
        {
            title: "Advanced Charts",
            description: "Analyze price movements with TradingView charts. Use indicators and drawing tools.",
            icon: BarChart
        },
        {
            title: "Portfolio Tracking",
            description: "Monitor your holdings, total value, and day's gain/loss in real-time.",
            icon: PieChart
        },
        {
            title: "Order History",
            description: "Review all your past trades. Learn from your entries and exits.",
            icon: History
        },
        {
            title: "Leaderboard",
            description: "Compete with other traders. See where you rank based on your profitability.",
            icon: Users
        },
        {
            title: "Mobile Friendly",
            description: "Trade on the go. Our platform is fully responsive and works on all devices.",
            icon: Smartphone
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-16 flex-1">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Powerful Features</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Everything you need to master the art of trading without risking a single rupee.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
