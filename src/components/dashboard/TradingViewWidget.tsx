
'use client';

import { useEffect, useRef, memo } from 'react';

// Declare global to avoid typescript error
declare global {
  interface Window {
    TradingView: any;
  }
}

let tvScriptLoadingPromise: Promise<void> | null = null;

function TradingViewWidget({ symbol = "NSE:NIFTY" }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const chartId = useRef(`tv_chart_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    const onLoadScriptRef = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        container.current.innerHTML = '';
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Asia/Kolkata",
          theme: "dark",
          style: "1",
          locale: "in",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartId.current,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
        });
      }
    };

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.id = 'tradingview-widget-loading-script';
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(onLoadScriptRef);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="h-[500px] w-full" id={chartId.current} ref={container} />
  );
}

export default memo(TradingViewWidget);
