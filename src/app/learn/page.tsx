
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LearnPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-12 flex-1">
                <h1 className="text-4xl font-bold mb-8 text-center">Learn to Trade</h1>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Basics of Stock Market</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert">
                            <p>The stock market is where buyers and sellers come together to trade shares in publicly listed companies.</p>
                            <ul>
                                <li><strong>Stock:</strong> Ownership share in a company.</li>
                                <li><strong>Exchange:</strong> Place where trading happens (NSE, BSE).</li>
                                <li><strong>Index:</strong> Nifty 50, Sensex (Market benchmarks).</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Understanding F&O (Futures & Options)</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert">
                            <p>Derivatives are financial contracts that derive their value from an underlying asset.</p>
                            <ul>
                                <li><strong>Futures:</strong> Obligation to buy/sell at a future date.</li>
                                <li><strong>Call Option (CE):</strong> Right to buy.</li>
                                <li><strong>Put Option (PE):</strong> Right to sell.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>3. Technical Analysis Basics</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert">
                            <p>Using charts and patterns to predict future price movements.</p>
                            <ul>
                                <li><strong>Candlestick:</strong> Shows Open, High, Low, Close prices.</li>
                                <li><strong>Support/Resistance:</strong> Key price levels.</li>
                                <li><strong>Trends:</strong> Upwards, Downwards, Sideways.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>4. Risk Management</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert">
                            <p>The most important skill for a trader.</p>
                            <ul>
                                <li><strong>Stop Loss:</strong> Exit point to limit loss.</li>
                                <li><strong>Position Sizing:</strong> How much capital to risk per trade.</li>
                                <li><strong>Rule:</strong> Never risk more than 1-2% of capital on one trade.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
