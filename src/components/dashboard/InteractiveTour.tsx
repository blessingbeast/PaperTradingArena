'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, ChevronRight, Check } from 'lucide-react';

const TOUR_STEPS = [
    {
        title: "Search Any Stock",
        content: "Type the name or symbol of any Indian stock to instantly load its live chart.",
        targetSelector: ".tour-search",
        placement: "bottom"
    },
    {
        title: "Change Timeframe",
        content: "Switch between 1m, 5m, or Daily charts to analyze different trends.",
        targetSelector: ".tour-timeframe",
        placement: "bottom"
    },
    {
        title: "Add Technical Indicators",
        content: "Overlay RSI, MACD, or Moving Averages to plan your entry and exit.",
        targetSelector: ".tour-indicators",
        placement: "bottom"
    },
    {
        title: "Place Your Order",
        content: "Choose Market or Limit, enter your quantity, and click BUY to execute your paper trade!",
        targetSelector: ".tour-order-panel",
        placement: "left"
    }
];

export function InteractiveTour() {
    const searchParams = useSearchParams();
    const isDemo = searchParams.get('demo') === 'true';
    const hideTour = searchParams.get('tour') === 'false';
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isDemo && !hideTour) {
            // Slight delay to let the UI render
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isDemo]);

    useEffect(() => {
        if (!isVisible || !isDemo || step >= TOUR_STEPS.length) return;

        const updatePosition = () => {
            const currentStepData = TOUR_STEPS[step];
            const el = document.querySelector(currentStepData.targetSelector);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Add highlight pulse wrapper effect to the target element
                el.classList.add('ring-4', 'ring-[#2563EB]', 'ring-opacity-50', 'transition-all', 'tour-highlight-active');

                let top = 0;
                let left = 0;

                if (currentStepData.placement === 'bottom') {
                    top = rect.bottom + 16;
                    left = rect.left + (rect.width / 2) - 160; // 320px width tooltip centered
                } else if (currentStepData.placement === 'left') {
                    top = rect.top + (rect.height / 2) - 100;
                    left = rect.left - 340;
                }

                // Ensure it doesn't go off screen
                if (left < 16) left = 16;
                if (left + 320 > window.innerWidth) left = window.innerWidth - 340;

                setPosition({ top, left });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            // Cleanup previous step's highlight
            document.querySelectorAll('.tour-highlight-active').forEach(el => {
                el.classList.remove('ring-4', 'ring-[#2563EB]', 'ring-opacity-50', 'transition-all', 'tour-highlight-active');
            });
        };
    }, [step, isVisible, isDemo]);

    if (!isDemo || !isVisible) return null;
    if (step >= TOUR_STEPS.length) return null;

    const currentStepData = TOUR_STEPS[step];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop Dimmer */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" />

            {/* Tooltip Card */}
            <div
                className="absolute w-[320px] bg-card border shadow-2xl rounded-xl p-5 pointer-events-auto transition-all duration-500 ease-out"
                style={{ top: position.top, left: position.left }}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black">
                            {step + 1}
                        </span>
                        {currentStepData.title}
                    </h3>
                    <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {currentStepData.content}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === step ? "bg-primary w-4" : "bg-muted-foreground/30")} />
                        ))}
                    </div>

                    <Button
                        size="sm"
                        onClick={() => {
                            if (step === TOUR_STEPS.length - 1) {
                                setIsVisible(false);
                            } else {
                                setStep(s => s + 1);
                            }
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-4"
                    >
                        {step === TOUR_STEPS.length - 1 ? (
                            <><Check className="w-4 h-4 mr-1" /> Finish Tour</>
                        ) : (
                            <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                        )}
                    </Button>
                </div>

                {/* Pointer Arrow */}
                <div
                    className={cn(
                        "absolute w-4 h-4 bg-card border-t border-l transform rotate-45",
                        currentStepData.placement === 'bottom' ? "-top-2 left-1/2 -ml-2" : "top-1/2 -right-2 -mt-2 rotate-135 border-r border-t-0 border-l-0"
                    )}
                />
            </div>
        </div>
    );
}
