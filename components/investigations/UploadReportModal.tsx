
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { InvestigationOrder } from '../../types';

interface UploadReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: InvestigationOrder | null;
    onUpload: (file: File) => void;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({ isOpen, onClose, order, onUpload }) => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (file) {
            onUpload(file);
            setFile(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {order && (
                        <div className="text-sm text-muted-foreground mb-4">
                            Uploading report for: <span className="font-semibold text-foreground">{order.name}</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Select File (PDF or Image)</Label>
                        <Input type="file" accept=".pdf,image/*" onChange={handleFileChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file}>Upload & Complete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
