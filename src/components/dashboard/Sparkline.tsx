import { cn } from "@/lib/utils";

export function Sparkline({ data, color = "currentColor", className }: { data: number[], color?: string, className?: string }) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Prevent division by zero
    const padding = range * 0.1;

    // Normalize points to SVG coordinates (0-100 x 0-30)
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 30 - (((d - min + padding) / (range + padding * 2)) * 30);
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg className={cn("h-8 w-24 overflow-visible", className)} viewBox="0 0 100 30" preserveAspectRatio="none">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
