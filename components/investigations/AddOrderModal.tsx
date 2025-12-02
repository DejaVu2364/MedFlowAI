
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InvestigationType } from '../../types';

interface AddOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (order: { name: string; type: InvestigationType; priority: 'routine' | 'urgent' | 'stat' }) => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<InvestigationType>('lab');
    const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit({ name, type, priority });
            setName('');
            setType('lab');
            setPriority('routine');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Investigation Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Investigation Name</Label>
                        <Input
                            placeholder="e.g., CBC, Chest X-Ray, MRI Brain"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as InvestigationType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lab">Lab Test</SelectItem>
                                    <SelectItem value="radiology">Radiology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="routine">Routine</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="stat">STAT (Immediate)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Place Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
