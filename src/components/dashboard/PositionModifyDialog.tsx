"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings2, Loader2, Target, AlertTriangle } from "lucide-react";

interface PositionModifyDialogProps {
    symbol: string;
    qty: number;
    avgPrice: number;
    currentLtp: number;
    isShort: boolean;
}

export function PositionModifyDialog({ symbol, qty, avgPrice, currentLtp, isShort }: PositionModifyDialogProps) {
    const [open, setOpen] = useState(false);
    const [slPrice, setSlPrice] = useState("");
    const [targetPrice, setTargetPrice] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const slNum = slPrice ? parseFloat(slPrice) : null;
        const targetNum = targetPrice ? parseFloat(targetPrice) : null;

        if (!slNum && !targetNum) {
            toast.error("Please enter a Stop Loss or Target price.");
            return;
        }

        // Basic validation
        if (isShort) {
            if (slNum && slNum <= currentLtp) {
                toast.error("Stop Loss for a SHORT position must be above the current price.");
                return;
            }
            if (targetNum && targetNum >= currentLtp) {
                toast.error("Target for a SHORT position must be below the current price.");
                return;
            }
        } else {
            if (slNum && slNum >= currentLtp) {
                toast.error("Stop Loss for a LONG position must be below the current price.");
                return;
            }
            if (targetNum && targetNum <= currentLtp) {
                toast.error("Target for a LONG position must be above the current price.");
                return;
            }
        }

        setLoading(true);
        try {
            // Cancel existing pending orders for this symbol first to avoid duplicates
            // Then place new SL/Target orders
            const res = await fetch('/api/trade/modify-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    qty: Math.abs(qty),
                    action: isShort ? 'BUY' : 'SELL', // Opposing action to close
                    stopLoss: slNum,
                    target: targetNum
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Position exit orders updated!");
                setOpen(false);
            } else {
                toast.error(data.error || "Failed to update exit orders.");
            }
        } catch (error: any) {
            toast.error(error.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="bg-black/20 hover:bg-black/30 shadow-sm text-white text-xs font-bold p-2 sm:p-2.5 rounded transition-all duration-300 flex items-center justify-center h-[34px] sm:h-[38px] group/mod border border-white/20" title="Modify SL/Target">
                    <Settings2 className="w-4 h-4 shrink-0" />
                    <span className="max-w-0 opacity-0 group-hover/mod:max-w-[40px] group-hover/mod:opacity-100 group-hover/mod:ml-1.5 transition-all duration-300 whitespace-nowrap overflow-hidden inline-block">Modify</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Modify Exit Orders <span className="text-muted-foreground text-sm font-normal">({symbol})</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex justify-between items-center text-sm p-3 bg-muted rounded-lg border">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">Position</span>
                            <span className="font-bold font-mono">{isShort ? 'SHORT' : 'LONG'} {Math.abs(qty)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-muted-foreground">LTP</span>
                            <span className="font-bold font-mono">₹{currentLtp > 0 ? currentLtp.toFixed(2) : '--'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Stop Loss Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                <Input
                                    type="number"
                                    placeholder={isShort ? "> LTP" : "< LTP"}
                                    className="pl-8 font-mono"
                                    value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-profit"><Target className="w-4 h-4" /> Target Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                <Input
                                    type="number"
                                    placeholder={isShort ? "< LTP" : "> LTP"}
                                    className="pl-8 font-mono"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Orders
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
