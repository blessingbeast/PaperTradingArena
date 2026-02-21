import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, TrendingUp, Shield, BarChart2, Zap, LayoutDashboard, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-primary/30">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-background pt-24 pb-32 lg:pt-36 lg:pb-40">
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />

                    <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-sm font-medium mb-8 text-muted-foreground">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Next-Gen Trading Simulator
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-6 leading-[1.1]">
                            Master the Markets. <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                                Zero Financial Risk.
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Practice trading Indian Stocks and F&O with ₹10 Lakh virtual capital.
                            Experience a beautifully designed, real-time environment built for learning.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full gap-2 shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                                    Start Trading Now <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="/learn">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-background/50 backdrop-blur">
                                    Learn the Basics
                                </Button>
                            </Link>
                        </div>

                        {/* Hero UI Mockup */}
                        <div className="mt-20 mx-auto max-w-5xl">
                            <div className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10 p-2">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                <div className="rounded-xl overflow-hidden bg-background aspect-[16/9] md:aspect-[21/9] flex flex-col items-center justify-center border border-border/50 shadow-inner">
                                    <LineChart className="w-16 h-16 text-primary/40 mb-4 animate-pulse" />
                                    <p className="text-muted-foreground font-medium text-lg">Interactive Dashboard Preview</p>
                                    <div className="flex gap-2 mt-4">
                                        <div className="w-12 h-2 rounded-full bg-primary/20" />
                                        <div className="w-8 h-2 rounded-full bg-primary/20" />
                                        <div className="w-16 h-2 rounded-full bg-primary/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-4 bg-muted/30 border-t border-border/50">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Why TradeSim India?</h2>
                            <p className="text-lg text-muted-foreground w-full max-w-2xl mx-auto">
                                We've built the most realistic and beautifully designed paper trading platform to help you transition to live markets with confidence.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<TrendingUp className="w-8 h-8 text-blue-500" />}
                                title="Real Market Experience"
                                description="Trade with real-time delayed data from NSE/BSE. Experience the volatility and emotion of trading without losing hard-earned money."
                            />
                            <FeatureCard
                                icon={<Shield className="w-8 h-8 text-green-500" />}
                                title="Risk-Free Environment"
                                description="Start with ₹1 Lakh or ₹1 Crore virtual capital. Reset your account anytime. The perfect sandbox for testing new strategies."
                            />
                            <FeatureCard
                                icon={<BarChart2 className="w-8 h-8 text-purple-500" />}
                                title="Performance Analytics"
                                description="Track your win rate, profit factor, and daily PnL through beautiful charts. Analyze your historic trades and improve your edge."
                            />
                            <FeatureCard
                                icon={<LayoutDashboard className="w-8 h-8 text-orange-500" />}
                                title="Pro-Grade Interface"
                                description="A clean, professional 3-column trading interface inspired by top brokers like Zerodha and Groww. Fast, responsive, and intuitive."
                            />
                            <FeatureCard
                                icon={<LineChart className="w-8 h-8 text-cyan-500" />}
                                title="Advanced Charting"
                                description="Built-in lightweight charts with multiple timeframes, crosshair tooltips, and real-time candle updates."
                            />
                            <FeatureCard
                                icon={<Zap className="w-8 h-8 text-yellow-500" />}
                                title="Live Margin & Brokerage"
                                description="Get precise estimations of required margins, brokerage fees, and STT charges before placing any order."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10" />
                    <div className="container relative z-10 mx-auto max-w-4xl text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to test your strategies?</h2>
                        <p className="text-xl text-muted-foreground mb-10">
                            Join thousands of traders practicing their skills on TradeSim India.
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                                Create Free Account
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-sm border border-border/50">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
