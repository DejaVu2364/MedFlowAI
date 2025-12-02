
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { getIsFirebaseInitialized } from './firebase';
import { BedManagerState, Ward, Room, Bed, BedStatus } from '../types';

const BED_STATE_DOC = 'bed_manager/state';

// Initial Seed Data (500 beds)
const INITIAL_WARDS: Ward[] = [
    {
        id: 'MED-1',
        name: 'General Medicine 1',
        department: 'General Medicine',
        rooms: Array.from({ length: 20 }, (_, i) => ({
            id: `1${i.toString().padStart(2, '0')}`,
            beds: [
                { id: `MED-1-1${i.toString().padStart(2, '0')}-A`, status: 'vacant', lastCleanedAt: Date.now() },
                { id: `MED-1-1${i.toString().padStart(2, '0')}-B`, status: 'vacant', lastCleanedAt: Date.now() }
            ]
        }))
    },
    {
        id: 'SURG-1',
        name: 'Surgery Ward 1',
        department: 'Surgery',
        rooms: Array.from({ length: 20 }, (_, i) => ({
            id: `2${i.toString().padStart(2, '0')}`,
            beds: [
                { id: `SURG-1-2${i.toString().padStart(2, '0')}-A`, status: 'vacant', lastCleanedAt: Date.now() },
                { id: `SURG-1-2${i.toString().padStart(2, '0')}-B`, status: 'vacant', lastCleanedAt: Date.now() }
            ]
        }))
    },
    {
        id: 'ICU-1',
        name: 'Intensive Care Unit',
        department: 'ICU',
        rooms: Array.from({ length: 15 }, (_, i) => ({
            id: `ICU-${i + 1}`,
            beds: [
                { id: `ICU-1-${i + 1}`, status: 'vacant', lastCleanedAt: Date.now() }
            ]
        }))
    },
    // Add more wards to reach ~500 beds if needed, for now this is a good start (~100 beds)
];

export const subscribeToBedState = (callback: (state: BedManagerState) => void) => {
    if (!getIsFirebaseInitialized()) {
        // Local Mode Fallback
        const stored = localStorage.getItem('medflow_bed_state');
        if (stored) {
            callback(JSON.parse(stored));
        } else {
            const initialState: BedManagerState = { wards: INITIAL_WARDS, lastUpdated: Date.now() };
            localStorage.setItem('medflow_bed_state', JSON.stringify(initialState));
            callback(initialState);
        }
        return () => { };
    }

    const db = getFirestore();
    return onSnapshot(doc(db, BED_STATE_DOC), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as BedManagerState);
        } else {
            // Initialize if missing
            const initialState: BedManagerState = { wards: INITIAL_WARDS, lastUpdated: Date.now() };
            setDoc(doc(db, BED_STATE_DOC), initialState);
            callback(initialState);
        }
    });
};

export const updateBedStatus = async (wardId: string, roomId: string, bedId: string, status: BedStatus, patientId?: string) => {
    if (!getIsFirebaseInitialized()) {
        // Local Mode
        const stored = localStorage.getItem('medflow_bed_state');
        if (stored) {
            const state: BedManagerState = JSON.parse(stored);
            const ward = state.wards.find(w => w.id === wardId);
            const room = ward?.rooms.find(r => r.id === roomId);
            const bed = room?.beds.find(b => b.id === bedId);

            if (bed) {
                bed.status = status;
                bed.lastCleanedAt = status === 'vacant' ? Date.now() : bed.lastCleanedAt;
                if (status === 'occupied' && patientId) {
                    bed.patientId = patientId;
                    bed.occupiedSince = Date.now();
                } else if (status === 'vacant' || status === 'cleaning') {
                    bed.patientId = undefined;
                    bed.occupiedSince = undefined;
                    bed.predictedDischargeAt = undefined;
                }
                state.lastUpdated = Date.now();
                localStorage.setItem('medflow_bed_state', JSON.stringify(state));
                // Trigger update via subscription (simulated by reload or polling in real app, 
                // but for local mode we might need a custom event or just rely on React state if this was a hook)
                // In this architecture, the UI should optimistically update or re-fetch.
            }
        }
        return;
    }

    const db = getFirestore();
    const stateRef = doc(db, BED_STATE_DOC);

    // We need to read-modify-write for nested array updates in Firestore 
    // unless we use arrayUnion/Remove which is hard for deep updates.
    // For simplicity in this prototype, we'll fetch the whole state.
    // In production, we'd use dot notation with known indices if possible, or a cloud function.

    try {
        const snap = await getDoc(stateRef);
        if (!snap.exists()) return;

        const state = snap.data() as BedManagerState;
        const wardIndex = state.wards.findIndex(w => w.id === wardId);
        if (wardIndex === -1) return;

        const roomIndex = state.wards[wardIndex].rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return;

        const bedIndex = state.wards[wardIndex].rooms[roomIndex].beds.findIndex(b => b.id === bedId);
        if (bedIndex === -1) return;

        const bed = state.wards[wardIndex].rooms[roomIndex].beds[bedIndex];
        bed.status = status;

        if (status === 'vacant') {
            bed.lastCleanedAt = Date.now();
            bed.patientId = undefined;
            bed.occupiedSince = undefined;
            bed.predictedDischargeAt = undefined;
        } else if (status === 'occupied' && patientId) {
            bed.patientId = patientId;
            bed.occupiedSince = Date.now();
        } else if (status === 'cleaning') {
            bed.patientId = undefined;
            bed.occupiedSince = undefined;
            bed.predictedDischargeAt = undefined;
        }

        state.lastUpdated = Date.now();

        await updateDoc(stateRef, {
            wards: state.wards,
            lastUpdated: state.lastUpdated
        });

    } catch (e) {
        console.error("Failed to update bed status", e);
    }
};

export const assignPatientToBed = async (wardId: string, roomId: string, bedId: string, patientId: string) => {
    await updateBedStatus(wardId, roomId, bedId, 'occupied', patientId);
};

export const dischargePatientFromBed = async (wardId: string, roomId: string, bedId: string) => {
    await updateBedStatus(wardId, roomId, bedId, 'cleaning');
};

export const markBedClean = async (wardId: string, roomId: string, bedId: string) => {
    await updateBedStatus(wardId, roomId, bedId, 'vacant');
};
