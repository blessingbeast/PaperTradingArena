'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowRight, Activity, TrendingUp, Shield, BarChart2, Zap,
    LayoutDashboard, LineChart, PlayCircle, CheckCircle2, Star,
    Check, ArrowUpRight
} from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] dark:bg-background selection:bg-[#2563EB]/30">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-32">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-[#38BDF8]/10 dark:bg-[#38BDF8]/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-[#2563EB]/10 dark:bg-[#2563EB]/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="container mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                        {/* Left Side Content */}
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-card border border-[#E2E8F0] dark:border-border text-sm font-semibold mb-6 shadow-sm">
                                <span className="flex h-2 w-2 rounded-full relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-full w-full bg-[#16A34A]"></span>
                                </span>
                                Live NSE & BSE Data Simulator
                            </div>

                            <h1 className="text-5xl lg:text-[64px] font-bold text-[#0F172A] dark:text-foreground leading-[1.1] mb-6 tracking-tight">
                                Trade Like a Pro. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#38BDF8]">
                                    Without Risk.
                                </span>
                            </h1>

                            <p className="text-xl text-[#0F172A]/70 dark:text-muted-foreground mb-10 font-medium leading-relaxed">
                                Practice Indian Stocks, Options & Futures with real market data and <span className="font-mono bg-[#2563EB]/10 text-[#2563EB] px-1.5 py-0.5 rounded">₹10 Lakh</span> virtual capital.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-[20px] bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] text-white shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:shadow-[0_8px_40px_rgb(37,99,235,0.4)] transition-all hover:scale-[1.02] gap-2 font-semibold border-0">
                                        Start Paper Trading <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="#demo" className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-[20px] bg-white dark:bg-card border-[#E2E8F0] dark:border-border hover:bg-[#F8FAFC] dark:hover:bg-accent text-[#0F172A] dark:text-foreground shadow-sm transition-all hover:scale-[1.02] gap-2 font-semibold">
                                        <PlayCircle className="w-5 h-5 text-[#2563EB]" /> Watch Demo
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-[#0F172A]/60 dark:text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-[#16A34A]" /> Zerodha-style UI
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-[#16A34A]" /> Real slippage simulation
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-[#16A34A]" /> Live Yahoo Finance data
                                </div>
                            </div>
                        </div>

                        {/* Right Side Mockup */}
                        <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none perspective-1000">
                            {/* Floating Chart Mockup */}
                            <div className="relative rounded-[20px] bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-gray-800 shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 transform lg:rotate-[-2deg] hover:rotate-0 transition-all duration-500 will-change-transform">
                                <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] dark:border-border pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-[#DC2626]/80 text-[8px] flex items-center justify-center text-white/0 hover:text-white transition-colors cursor-default"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#16A34A]/80"></div>
                                        </div>
                                        <div className="font-semibold text-[#0F172A] dark:text-gray-100 flex items-center gap-2">
                                            NIFTY 50
                                            <span className="text-[#16A34A] text-[10px] bg-[#16A34A]/10 px-1.5 py-0.5 rounded font-mono">+124.50 (0.58%)</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-[#0F172A]/50 dark:text-muted-foreground flex gap-3">
                                        <span>1D</span>
                                        <span>Indicators</span>
                                    </div>
                                </div>

                                {/* Fake Chart Canvas */}
                                <div className="relative h-[300px] w-full rounded-lg overflow-hidden flex items-end justify-between px-2 pb-2">
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>

                                    {/* Candlesticks Mock */}
                                    {[20, 40, 30, 50, 45, 65, 55, 75, 85, 70, 90, 110, 105, 120, 135, 130, 150].map((h, i) => {
                                        const isUp = i === 0 || h > [20, 40, 30, 50, 45, 65, 55, 75, 85, 70, 90, 110, 105, 120, 135, 130, 150][i - 1];
                                        return (
                                            <div key={i} className="relative w-4 flex flex-col items-center group z-10" style={{ height: `${h + 40}px` }}>
                                                {/* Wick */}
                                                <div className={`w-0.5 h-full absolute top-0 ${isUp ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}></div>
                                                {/* Body */}
                                                <div className={`w-full absolute ${isUp ? 'bg-[#16A34A]' : 'bg-[#DC2626]'} rounded-sm top-[10%] bottom-[10%] group-hover:brightness-110 transition-all`}></div>
                                            </div>
                                        )
                                    })}

                                    {/* Moving Average Line Overlay */}
                                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" preserveAspectRatio="none">
                                        <path d="M0,280 Q50,260 100,270 T200,220 T300,200 T400,150 T500,180 T600,100" fill="none" stroke="#2563EB" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                    </svg>
                                </div>
                            </div>

                            {/* Little floating element */}
                            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-[#1E293B] p-4 rounded-[20px] shadow-xl border border-[#E2E8F0] dark:border-gray-800 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 text-[#16A34A]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#0F172A]/50 dark:text-muted-foreground uppercase tracking-wider">Executed</p>
                                        <p className="font-mono font-bold text-sm text-[#0F172A] dark:text-white">Bought 50 RELIANCE</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* Trust Section */}
                <section className="py-12 border-y border-[#E2E8F0] dark:border-border bg-white dark:bg-card">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-[#E2E8F0] dark:divide-border text-center">
                            <div className="px-4">
                                <h3 className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white mb-1">10,000+</h3>
                                <p className="text-sm font-medium text-[#0F172A]/60 dark:text-muted-foreground">Trades Simulated</p>
                            </div>
                            <div className="px-4">
                                <h3 className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white mb-1">500+</h3>
                                <p className="text-sm font-medium text-[#0F172A]/60 dark:text-muted-foreground">Active Traders</p>
                            </div>
                            <div className="px-4">
                                <h3 className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white mb-1">99%</h3>
                                <p className="text-sm font-medium text-[#0F172A]/60 dark:text-muted-foreground">Realistic Order Engine</p>
                            </div>
                            <div className="px-4 flex flex-col justify-center items-center gap-1.5">
                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">Supported Integrations</p>
                                <div className="flex items-center gap-2 text-[#0F172A]/60 dark:text-muted-foreground text-xs font-medium">
                                    <span className="bg-muted px-2 py-1 rounded">NSE Data</span>
                                    <span>•</span>
                                    <span className="bg-muted px-2 py-1 rounded">Yahoo Finance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-[#F8FAFC] dark:bg-background">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold text-[#0F172A] dark:text-white mb-6">Built for Serious Traders.</h2>
                            <p className="text-lg text-[#0F172A]/70 dark:text-muted-foreground font-medium">
                                We abandoned gamified toy interfaces. PaperTradingArena is a professional tool built to mirror the exact environment you'll face when trading with real capital.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<TrendingUp className="w-6 h-6 text-[#2563EB]" />}
                                title="Real Market Simulator"
                                description="Live delayed data routing from NSE & BSE. Experience exact market volatility and momentum swings."
                            />
                            <FeatureCard
                                icon={<LineChart className="w-6 h-6 text-[#38BDF8]" />}
                                title="Advanced Charting"
                                description="Deep technical analysis with EMA, MACD, RSI, volume profiles, and multi-chart split layouts."
                            />
                            <FeatureCard
                                icon={<Activity className="w-6 h-6 text-[#16A34A]" />}
                                title="Watchlists & Alerts"
                                description="Group stocks, track 52w highs, volume spikes, and monitor real-time price flashes."
                            />
                            <FeatureCard
                                icon={<Zap className="w-6 h-6 text-orange-500" />}
                                title="Real Brokerage Math"
                                description="Every trade calculates precise STT, Stamp Duty, GST, and broker margins behind the scenes."
                            />
                            <FeatureCard
                                icon={<LayoutDashboard className="w-6 h-6 text-purple-500" />}
                                title="Strategy Analytics"
                                description="An automated Trading Journal calculates your Win Rate, Max Drawdown, and annotates mistakes."
                            />
                            <FeatureCard
                                icon={<Shield className="w-6 h-6 text-rose-500" />}
                                title="No Risk Learning"
                                description="Test options strategies and risky setups without the fear of blowing up a live margin account."
                            />
                        </div>
                    </div>
                </section>

                {/* Live Demo Mac Mockup */}
                <section id="demo" className="py-24 bg-white dark:bg-[#0F172A] overflow-hidden">
                    <div className="container mx-auto px-4 max-w-7xl text-center">
                        <h2 className="text-3xl md:text-5xl font-bold text-[#0F172A] dark:text-white mb-6">See it in action.</h2>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <button
                                onClick={() => {
                                    const img = document.getElementById('demo-video') as HTMLImageElement;
                                    if (img) {
                                        const src = img.src.split('?')[0];
                                        img.src = '';
                                        img.src = src + '?v=' + Date.now();
                                        img.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                                className="h-12 px-8 text-base rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-[#2563EB]/20 hover:shadow-[#2563EB]/40 font-semibold transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <PlayCircle className="w-5 h-5" /> Watch Demo
                            </button>
                            <Link href="/dashboard/trade?demo=true" className="w-full sm:w-auto">
                                <Button variant="outline" className="h-12 px-8 text-base rounded-full bg-[#F8FAFC] dark:bg-card border-[#E2E8F0] dark:border-border hover:bg-[#E2E8F0] dark:hover:bg-accent text-[#0F172A] dark:text-foreground shadow-sm font-semibold w-full sm:w-auto">
                                    🚀 Try Interactive Demo
                                </Button>
                            </Link>
                        </div>

                        {/* Video / Laptop Mockup Frame */}
                        <div className="relative mx-auto max-w-5xl rounded-[2rem] bg-[#1E293B] p-2 md:p-4 shadow-2xl shadow-[#1E40AF]/10 border border-[#E2E8F0] dark:border-gray-800 transform hover:scale-[1.01] transition-transform duration-500">
                            {/* Browser/Laptop Top Bar */}
                            <div className="flex items-center justify-between mb-2 md:mb-4 px-2">
                                <div className="flex gap-1.5 flex-1">
                                    <div className="w-3 h-3 rounded-full bg-[#DC2626]"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#16A34A]"></div>
                                </div>
                                <div className="text-center text-xs md:text-sm text-gray-400 font-mono tracking-wider flex-1 truncate">
                                    trade.simulator.com
                                </div>
                                <div className="flex-1 flex justify-end">
                                    {/* Action buttons overlay for demo */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                const img = document.getElementById('demo-video') as HTMLImageElement;
                                                if (img) {
                                                    const src = img.src.split('?')[0];
                                                    img.src = '';
                                                    img.src = src + '?v=' + Date.now();
                                                }
                                            }}
                                            className="text-xs text-gray-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                                        >
                                            ▶ Replay
                                        </button>
                                        <Link href="/dashboard/trade?demo=true" className="text-xs text-[#38BDF8] hover:text-[#7DD3FC] font-bold flex items-center gap-1 transition-colors">
                                            ⏩ Skip to trading
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Video Container */}
                            <div className="relative aspect-video bg-black rounded-[12px] overflow-hidden border border-gray-800 shadow-inner group">
                                <img
                                    id="demo-video"
                                    src="/demo.webp?v=3"
                                    alt="Paper Trading Platform Demo"
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                            </div>

                            {/* Mac Base shadow matching older visual flair */}
                            <div className="w-[120%] h-12 bg-gradient-to-t from-transparent to-black/20 dark:to-white/5 absolute -bottom-6 -left-[10%] blur-xl -z-10 rounded-full"></div>
                        </div>

                        {/* Professional Badges */}
                        <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-12">
                            <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-[#0F172A]/70 dark:text-gray-300 bg-white/50 dark:bg-card/50 px-4 py-2 rounded-full border border-border">
                                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" /> Real NSE/BSE Data
                            </div>
                            <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-[#0F172A]/70 dark:text-gray-300 bg-white/50 dark:bg-card/50 px-4 py-2 rounded-full border border-border">
                                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" /> Zerodha-style UI
                            </div>
                            <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-[#0F172A]/70 dark:text-gray-300 bg-white/50 dark:bg-card/50 px-4 py-2 rounded-full border border-border">
                                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" /> No Signup Needed
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Trade Sim Section */}
                <section className="py-24 bg-[#F8FAFC] dark:bg-background border-t border-[#E2E8F0] dark:border-border">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="grid lg:grid-cols-3 gap-12">
                            <div className="flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">No Risk Learning</h3>
                                <p className="text-[#0F172A]/70 dark:text-muted-foreground font-medium leading-relaxed">
                                    Most beginners wipe their accounts in the first 90 days. Sidestep the learning tax completely. Build your screen time, understand market mechanics, and identify your edge without risking a single rupee.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center mb-2">
                                    <LayoutDashboard className="w-6 h-6 text-[#2563EB]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Real Broker-Style Interface</h3>
                                <p className="text-[#0F172A]/70 dark:text-muted-foreground font-medium leading-relaxed">
                                    No gamified buttons or confusing layouts. Our terminal is mathematically modeled after leading brokers like Zerodha Kite and Groww. When you switch to a live account, you'll already know exactly how to execute orders.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                                    <BarChart2 className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Strategy Testing Engine</h3>
                                <p className="text-[#0F172A]/70 dark:text-muted-foreground font-medium leading-relaxed">
                                    Wondering if moving average crossovers actually work on NIFTY? Test it. The execution engine enforces strict liquidity slippage rules, preventing you from developing unrealistic fills.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section className="py-24 bg-white dark:bg-card">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-4">Loved by Traders.</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Card className="rounded-[20px] bg-[#F8FAFC] dark:bg-background border-[#E2E8F0] dark:border-border shadow-sm">
                                <CardContent className="p-8">
                                    <div className="flex text-yellow-500 mb-4">
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                    </div>
                                    <p className="text-lg text-[#0F172A]/80 dark:text-muted-foreground font-medium italic mb-6">
                                        "The charting and margin calculation is insanely accurate. It helped me move from a ₹50k loss on real markets to consistent profitability by testing my rules here first."
                                    </p>
                                    <div className="font-semibold text-[#0F172A] dark:text-white">— Rahul M., Option Buyer</div>
                                </CardContent>
                            </Card>
                            <Card className="rounded-[20px] bg-[#F8FAFC] dark:bg-background border-[#E2E8F0] dark:border-border shadow-sm">
                                <CardContent className="p-8">
                                    <div className="flex text-yellow-500 mb-4">
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                        <Star fill="currentColor" className="w-5 h-5" />
                                    </div>
                                    <p className="text-lg text-[#0F172A]/80 dark:text-muted-foreground font-medium italic mb-6">
                                        "Better than most paid simulators. The UI is literally 1:1 with my actual broker. I use it every day to forward-test my intraday stock setups without burning buying power."
                                    </p>
                                    <div className="font-semibold text-[#0F172A] dark:text-white">— Priya S., Intraday Equity</div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden py-32 bg-[#0F172A]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/40 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to Beat the Market?</h2>
                        <p className="text-xl text-[#F8FAFC]/70 mb-10 font-medium">
                            Claim your ₹10,00,000 virtual capital and start finding your edge today.
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-10 text-lg rounded-[20px] bg-white text-[#0F172A] hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all hover:scale-[1.02] font-bold border-0">
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
        <Card className="group rounded-[20px] bg-white dark:bg-card border-[#E2E8F0] dark:border-border hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 relative z-10">
                <div className="w-12 h-12 rounded-full border border-[#E2E8F0] dark:border-border bg-[#F8FAFC] dark:bg-background flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[#2563EB]/30 transition-all duration-300">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-3">{title}</h3>
                <p className="text-[#0F172A]/70 dark:text-muted-foreground font-medium leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
