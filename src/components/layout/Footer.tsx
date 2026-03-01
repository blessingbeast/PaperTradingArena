import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t bg-background py-10 mt-auto">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="md:col-span-2">
                        <Link href="/" className="font-bold text-[22px] flex items-center gap-2 tracking-[0.5px] group mb-4">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-300">
                                <rect width="28" height="28" rx="6" fill="url(#paint0_linear_footer)" />
                                <path d="M14 6V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M10 10H18V18H10V10Z" fill="white" />
                                <path d="M14 6L10 10H18L14 6Z" fill="white" />
                                <defs>
                                    <linearGradient id="paint0_linear_footer" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#1E40AF" />
                                        <stop offset="1" stopColor="#38BDF8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#38BDF8] dark:from-white dark:to-white">
                                PaperTradingArena
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm max-w-sm mb-4">
                            The most realistic paper trading platform for Indian markets. Practice stocks and options without financial risk.
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            For educational purposes only.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-foreground mb-1">Company</h4>
                        <Link href="/about" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">About</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">Terms</Link>
                        <Link href="/contact" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">Contact</Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-foreground mb-1">Community</h4>
                        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">Telegram</a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[#2563EB] transition-colors">Twitter / X</a>
                    </div>
                </div>

                <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} PaperTradingArena. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
