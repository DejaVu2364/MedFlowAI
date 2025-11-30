import React, { useState } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Plus } from "lucide-react";
import { ChiefComplaint } from '../../types';

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

    const handleAdd = () => {
        if (!currentComplaint.trim() || !currentDurationValue) return;

        const newComplaint: ChiefComplaint = {
            complaint: currentComplaint.trim(),
            durationValue: parseInt(currentDurationValue),
            durationUnit: currentDurationUnit
        };

        onChange([...value, newComplaint]);
        setCurrentComplaint("");
        setCurrentDurationValue("");
        setCurrentDurationUnit("days");
    };

    const handleRemove = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Symptom</label>
                    <Input
                        data-testid="complaint-input"
                        placeholder="e.g. Fever"
                        value={currentComplaint}
                        onChange={(e) => setCurrentComplaint(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-white/50"
                        disabled={disabled}
                    />
                </div>
                <div className="w-24 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Duration</label>
                    <Input
                        data-testid="duration-value-input"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={currentDurationValue}
                        onChange={(e) => setCurrentDurationValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-white/50"
                        disabled={disabled}
                    />
                </div>
                <div className="w-28 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Unit</label>
                    <select
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
                    variant="secondary"
                    className="mb-[2px]"
                    disabled={disabled || !currentComplaint.trim() || !currentDurationValue}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <div className="flex flex-wrap gap-2">
                {value.map((item, index) => (
                    <Badge key={index} data-testid={`complaint-badge-${index}`} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-2 text-sm font-normal bg-white/60 hover:bg-white/80 transition-colors border-slate-200">
                        <span>{item.complaint}</span>
                        <span className="text-muted-foreground border-l border-slate-300 pl-2 ml-1 text-xs">
                            {item.durationValue} {item.durationUnit}
                        </span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </Badge>
                ))}
                {value.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">No complaints added yet.</p>
                )}
            </div>
        </div>
    );
};
