
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { getIsFirebaseInitialized } from './firebase';
import { InvestigationOrder, InvestigationReport, InvestigationType } from '../types';

// Helper to get collection refs
const getOrdersRef = (patientId: string) => {
    const db = getFirestore();
    return collection(db, `patients/${patientId}/investigations/orders`);
};

const getReportsRef = (patientId: string) => {
    const db = getFirestore();
    return collection(db, `patients/${patientId}/investigations/reports`);
};

// --- Orders ---

export const createInvestigationOrder = async (patientId: string, order: Omit<InvestigationOrder, 'id' | 'status' | 'orderedAt'>) => {
    if (!getIsFirebaseInitialized()) {
        console.warn("Firebase not initialized, skipping createInvestigationOrder");
        return;
    }

    try {
        const newOrder: Omit<InvestigationOrder, 'id'> = {
            ...order,
            status: 'ordered',
            orderedAt: Date.now()
        };
        await addDoc(getOrdersRef(patientId), newOrder);
    } catch (e) {
        console.error("Error creating investigation order:", e);
        throw e;
    }
};

export const subscribeToOrders = (patientId: string, callback: (orders: InvestigationOrder[]) => void) => {
    if (!getIsFirebaseInitialized()) return () => { };

    const q = query(getOrdersRef(patientId), orderBy('orderedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestigationOrder));
        callback(orders);
    });
};

export const updateOrderStatus = async (patientId: string, orderId: string, status: InvestigationOrder['status'], reportId?: string) => {
    if (!getIsFirebaseInitialized()) return;

    const db = getFirestore();
    const orderRef = doc(db, `patients/${patientId}/investigations/orders/${orderId}`);

    const updates: Partial<InvestigationOrder> = { status };
    if (status === 'completed') {
        updates.completedAt = Date.now();
    }
    if (reportId) {
        updates.reportId = reportId;
    }

    await updateDoc(orderRef, updates);
};

// --- Reports ---

export const uploadInvestigationReport = async (patientId: string, report: Omit<InvestigationReport, 'id' | 'uploadedAt'>) => {
    if (!getIsFirebaseInitialized()) return;

    try {
        const newReport: Omit<InvestigationReport, 'id'> = {
            ...report,
            uploadedAt: Date.now()
        };

        const docRef = await addDoc(getReportsRef(patientId), newReport);

        // Auto-update order status
        await updateOrderStatus(patientId, report.orderId, 'completed', docRef.id);

        return docRef.id;
    } catch (e) {
        console.error("Error uploading report:", e);
        throw e;
    }
};

export const subscribeToReports = (patientId: string, callback: (reports: InvestigationReport[]) => void) => {
    if (!getIsFirebaseInitialized()) return () => { };

    const q = query(getReportsRef(patientId), orderBy('uploadedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestigationReport));
        callback(reports);
    });
};
