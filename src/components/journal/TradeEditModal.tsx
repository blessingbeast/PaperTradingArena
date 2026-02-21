import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface TradeEditModalProps {
    entry: any | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

const EMOTIONS = ['None', 'Confident', 'Hesitant', 'Fear', 'FOMO', 'Greedy', 'Revenge', 'Tilted'];
const MISTAKES = ['None', 'Overtrading', 'Hesitation', 'Late Entry', 'Early Exit', 'Ignored Rules', 'Revenge Trading', 'Size Too Big'];

export function TradeEditModal({ entry, isOpen, onClose, onSaved }: TradeEditModalProps) {
    const [notes, setNotes] = useState("");
    const [emotion, setEmotion] = useState("None");
    const [mistake, setMistake] = useState("None");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (entry) {
            setNotes(entry.notes || "");
            setEmotion(entry.emotion_tag || "None");
            setMistake(entry.mistake_tag || "None");
        } else {
            setNotes("");
            setEmotion("None");
            setMistake("None");
        }
    }, [entry, isOpen]);

    const handleSave = async () => {
        if (!entry) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/journal', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: entry.id,
                    notes,
                    emotion_tag: emotion === 'None' ? null : emotion,
                    mistake_tag: mistake === 'None' ? null : mistake
                })
            });

            if (!res.ok) throw new Error(await res.text());

            toast.success("Trade updated successfully");
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update trade");
        } finally {
            setIsSaving(false);
        }
    }

    if (!entry) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trade Record</DialogTitle>
                    <DialogDescription>
                        {entry.symbol} ({entry.side}) • PnL: <span className={entry.pnl >= 0 ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>{entry.pnl > 0 ? '+' : ''}{entry.pnl}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Emotion</Label>
                        <Select value={emotion} onValueChange={setEmotion}>
                            <SelectTrigger className="w-full col-span-3">
                                <SelectValue placeholder="How did you feel?" />
                            </SelectTrigger>
                            <SelectContent>
                                {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Mistake</Label>
                        <Select value={mistake} onValueChange={setMistake}>
                            <SelectTrigger className="w-full col-span-3">
                                <SelectValue placeholder="Did you make a mistake?" />
                            </SelectTrigger>
                            <SelectContent>
                                {MISTAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Notes</Label>
                        <Textarea
                            className="col-span-3 min-h-[100px]"
                            placeholder="Write down your setup, thoughts, or what you learned..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
