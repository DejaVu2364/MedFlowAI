import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Plus, AlertCircle } from "lucide-react";
import { ChiefComplaint } from '../../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

interface MultiComplaintWithDurationProps {
    value: ChiefComplaint[];
    onChange: (complaints: ChiefComplaint[]) => void;
    error?: string;
    disabled?: boolean;
}

export const MultiComplaintWithDuration: React.FC<MultiComplaintWithDurationProps> = ({ value, onChange, error, disabled }) => {
    const [currentComplaint, setCurrentComplaint] = useState("");
    const [currentDurationValue, setCurrentDurationValue] = useState<string>("");
    const [currentDurationUnit, setCurrentDurationUnit] = useState<"hours" | "days" | "weeks" | "months">("days");
    const [localError, setLocalError] = useState<string | null>(null);

    const handleAdd = () => {
        if (!currentComplaint.trim()) {
            setLocalError("Symptom is required");
            return;
        }

        // Allow adding without duration if needed, but per requirements we want validation.
        // Wait, "Disable only if text is empty" implies duration might be optional?
        // But the badge shows duration. Let's make duration default to 1 day if empty?
        // Or assume the user must enter it.
        // "Fix: Disable only if text is empty."

        const durationVal = currentDurationValue ? parseInt(currentDurationValue) : 1;

        const newComplaint: ChiefComplaint = {
            complaint: currentComplaint.trim(),
            durationValue: durationVal,
            durationUnit: currentDurationUnit
        };

        onChange([...value, newComplaint]);
        setCurrentComplaint("");
        setCurrentDurationValue("");
        setCurrentDurationUnit("days");
        setLocalError(null);
    };

    const handleRemove = (index: number) => {
        if (disabled) return;
        if (window.confirm(`Remove "${value[index].complaint}"?`)) {
            const newValue = [...value];
            newValue.splice(index, 1);
            onChange(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const isAddDisabled = disabled || !currentComplaint.trim();

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                    <Label className="text-xs font-semibold text-muted-foreground">Symptom</Label>
                    <Input
                        data-testid="complaint-input"
                        placeholder="e.g. Severe headache"
                        value={currentComplaint}
                        onChange={(e) => {
                            setCurrentComplaint(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        className="bg-white/50 focus:bg-white transition-colors"
                        disabled={disabled}
                    />
                </div>
                <div className="w-full sm:w-24 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Duration</Label>
                    <Input
                        data-testid="duration-value-input"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={currentDurationValue}
                        onChange={(e) => setCurrentDurationValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-white/50 focus:bg-white transition-colors"
                        disabled={disabled}
                    />
                </div>
                <div className="w-full sm:w-32 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Unit</Label>
                    <select // Using native select for simplicity and robustness in this complex form row
                        data-testid="duration-unit-select"
                        value={currentDurationUnit}
                        onChange={(e) => setCurrentDurationUnit(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                    >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                    </select>
                </div>
                <Button
                    data-testid="add-complaint-button"
                    type="button"
                    onClick={handleAdd}
                    size="icon"
                    variant={isAddDisabled ? "ghost" : "default"}
                    className="mb-[2px] shrink-0"
                    disabled={isAddDisabled}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {(error || localError) && (
                <div className="flex items-center gap-2 text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    <p>{error || localError}</p>
                </div>
            )}

            <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {value.map((item, index) => (
                    <Badge
                        key={index}
                        data-testid={`complaint-badge-${index}`}
                        variant="secondary"
                        className="pl-3 pr-1 py-1.5 flex items-center gap-2 text-sm font-normal bg-secondary/50 border-secondary-foreground/10 hover:bg-secondary/70 transition-colors"
                    >
                        <span className="font-medium text-foreground">{item.complaint}</span>
                        <span className="text-muted-foreground border-l border-border pl-2 ml-1 text-xs">
                            {item.durationValue} {item.durationUnit}
                        </span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                title="Remove complaint"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </Badge>
                ))}
                {value.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-1 flex items-center gap-2 opacity-60">
                        No complaints added. Enter a symptom above.
                    </p>
                )}
            </div>
        </div>
    );
};
