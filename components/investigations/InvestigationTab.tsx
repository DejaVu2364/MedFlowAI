
import React, { useState, useEffect } from 'react';
import { Patient, InvestigationOrder, InvestigationReport } from '../../types';
import { subscribeToOrders, subscribeToReports, createInvestigationOrder, uploadInvestigationReport } from '../../services/investigationService';
import { OrderList } from './OrderList';
import { AddOrderModal } from './AddOrderModal';
import { UploadReportModal } from './UploadReportModal';
import { ReportViewer } from './ReportViewer';
import { Button } from '../ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';

interface InvestigationTabProps {
    patient: Patient;
}

export const InvestigationTab: React.FC<InvestigationTabProps> = ({ patient }) => {
    const [orders, setOrders] = useState<InvestigationOrder[]>([]);
    const [reports, setReports] = useState<InvestigationReport[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<InvestigationOrder | null>(null);
    const [selectedReport, setSelectedReport] = useState<InvestigationReport | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeOrders = subscribeToOrders(patient.id, setOrders);
        const unsubscribeReports = subscribeToReports(patient.id, setReports);
        return () => {
            unsubscribeOrders();
            unsubscribeReports();
        };
    }, [patient.id]);

    const handleCreateOrder = async (orderData: any) => {
        try {
            await createInvestigationOrder(patient.id, orderData);
            addToast("Investigation ordered successfully", 'success');
        } catch (e) {
            addToast("Failed to create order", 'error');
        }
    };

    const handleUploadClick = (order: InvestigationOrder) => {
        setSelectedOrder(order);
        setIsUploadModalOpen(true);
    };

    const handleViewReportClick = (order: InvestigationOrder) => {
        const report = reports.find(r => r.id === order.reportId);
        if (report) {
            setSelectedReport(report);
            setIsViewerOpen(true);
        } else {
            addToast("Report not found", 'error');
        }
    };

    const handleUpload = async (file: File) => {
        if (!selectedOrder) return;

        try {
            // In a real app, upload to Firebase Storage here and get URL.
            // For demo, we create a fake URL or use a placeholder if it's an image we can display locally via FileReader (but that's temporary).
            // Let's simulate a URL.
            const fakeUrl = URL.createObjectURL(file);

            await uploadInvestigationReport(patient.id, {
                orderId: selectedOrder.id,
                patientId: patient.id,
                type: selectedOrder.type,
                format: file.type.includes('pdf') ? 'pdf' : 'image',
                url: fakeUrl, // In real app: storageUrl
                aiSummary: undefined, // Will be generated on view
                aiFlags: undefined
            });

            addToast("Report uploaded successfully", 'success');
        } catch (e) {
            addToast("Failed to upload report", 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Investigations & Reports</h3>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Order
                </Button>
            </div>

            <OrderList
                orders={orders}
                onUploadClick={handleUploadClick}
                onViewReportClick={handleViewReportClick}
            />

            <AddOrderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateOrder}
            />

            <UploadReportModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                order={selectedOrder}
                onUpload={handleUpload}
            />

            {selectedReport && (
                <ReportViewer
                    isOpen={isViewerOpen}
                    onClose={() => setIsViewerOpen(false)}
                    report={selectedReport}
                />
            )}
        </div>
    );
};
