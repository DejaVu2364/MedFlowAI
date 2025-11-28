import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient, OrderCategory, OrderPriority } from '../types';
import {
    Activity,
    FileText,
    Pill,
    Stethoscope,
    ClipboardList,
    Search,
    Plus,
    Send,
    Beaker,
    Image as ImageIcon,
    Syringe,
    Scissors
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

// External Components
import ClinicalFileRedesigned from '../components/clinical/ClinicalFileRedesigned';
import MedViewRedesigned from '../components/medview/MedViewRedesigned';
import { VitalsRedesigned } from '../components/vitals/VitalsRedesigned';
import { RoundsRedesigned } from '../components/rounds/RoundsRedesigned';
import { PatientJourney } from '../components/patient/PatientJourney';

// --- PATIENT HEADER ---

const PatientHeader: React.FC<{ patient: Patient; onTabChange: (tab: any) => void; navigate: any }> = React.memo(({ patient, onTabChange, navigate }) => {
    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{patient.name}</h1>
                            <Badge variant={patient.triage.level === 'Red' ? 'destructive' : patient.triage.level === 'Yellow' ? 'secondary' : 'outline'} className={cn("uppercase text-[10px] tracking-wider font-bold", patient.triage.level === 'Yellow' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200")}>
                                {patient.triage.level} Priority
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{patient.age}y</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-medium text-foreground">{patient.gender}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono text-xs">MRN: {patient.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4 hidden md:flex">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                        <span className="text-sm font-semibold text-foreground">{patient.status}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onTabChange('vitals')}>
                        <Activity className="w-4 h-4 mr-2" />
                        Vitals
                    </Button>
                    <Button variant="default" size="sm" onClick={() => navigate(`/discharge/${patient.id}`)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Discharge
                    </Button>
                </div>
            </div>
            <Separator />
        </div>
    );
});

// --- ORDERS TAB (Legacy Logic Wrapped) ---

const CATALOG_ITEMS: Record<OrderCategory, string[]> = {
    investigation: [
        'Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Comprehensive Metabolic Panel (CMP)',
        'Liver Function Tests (LFT)', 'Lipid Panel', 'Thyroid Stimulating Hormone (TSH)',
        'Hemoglobin A1c', 'Urinalysis', 'Urine Culture', 'Coagulation Profile (PT/INR/PTT)',
        'Troponin I', 'D-Dimer', 'Blood Culture x2', 'Serum Lactate', 'Procalcitonin',
        'Arterial Blood Gas (ABG)', 'Serum Electrolytes', 'Iron Studies', 'Vitamin B12 / Folate',
        'C-Reactive Protein (CRP)', 'ESR', 'Dengue Serology (NS1, IgM, IgG)', 'Peripheral Smear for MP',
        'Widal Test', 'Rapid Malaria Antigen', 'Stool Routine & Microscopy', 'Renal Function Test (Urea/Creat)'
    ],
    radiology: [
        'CXR - PA View', 'CXR - AP View', 'CXR - Lateral', 'CT Head Non-Contrast', 'CT Head w/ Contrast',
        'CT Abdomen/Pelvis w/ Contrast', 'CT Chest Pulmonary Angiogram', 'MRI Brain', 'MRI Spine',
        'Ultrasound Abdomen', 'Ultrasound KUB', 'Ultrasound Doppler Lower Limb', 'X-Ray Left Arm',
        'X-Ray Right Arm', 'X-Ray Left Leg', 'X-Ray Right Leg', 'Echocardiogram'
    ],
    medication: [
        'Paracetamol 500mg PO', 'Paracetamol 1g IV', 'Ibuprofen 400mg PO', 'Morphine 2mg IV',
        'Fentanyl 50mcg IV', 'Ondansetron 4mg IV', 'Metoclopramide 10mg IV', 'Pantoprazole 40mg IV',
        'Ceftriaxone 1g IV', 'Amoxicillin 500mg PO', 'Piperacillin-Tazobactam 4.5g IV', 'Vancomycin 1g IV',
        'Azithromycin 500mg PO', 'Furosemide 40mg IV', 'Metoprolol 25mg PO', 'Amlodipine 5mg PO',
        'Normal Saline 500ml Bolus', 'Lactated Ringers 1L', 'D5W 1L', 'Insulin Regular', 'Insulin Glargine',
        'Atorvastatin 40mg PO', 'Aspirin 75mg PO', 'Ceftriaxone 2g IV BD', 'Doxycycline 100mg PO'
    ],
    procedure: [
        'Peripheral IV Cannulation', 'Urinary Catheterization', 'Nasogastric Tube Insertion',
        'ECG (12 Lead)', 'Wound Dressing', 'Suturing', 'Blood Transfusion', 'Central Line Insertion',
        'Lumbar Puncture', 'Paracentesis', 'Thoracentesis', 'Splint Application', 'Cast Application'
    ],
    nursing: [
        'Vitals Monitoring q4h', 'Vitals Monitoring q1h', 'Strict I/O Charting', 'Fall Risk Precautions',
        'Bed Rest', 'Ambulate with Assistance', 'Diabetic Diet', 'NPO', 'Clear Liquid Diet', 'Neurological Obs q1h'
    ],
    referral: [
        'Cardiology Consult', 'General Surgery Consult', 'Orthopedics Consult', 'Neurology Consult',
        'Gastroenterology Consult', 'Nephrology Consult', 'Infectious Disease Consult', 'Physiotherapy', 'Dietician'
    ]
};

const OrdersTab: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    const { updateOrder, addOrderToPatient, sendAllDrafts } = usePatient();
    const [activeCategory, setActiveCategory] = useState<OrderCategory>('investigation');
    const [searchTerm, setSearchTerm] = useState('');

    const categories: { key: OrderCategory; label: string; icon: any }[] = [
        { key: 'investigation', label: 'Labs', icon: Beaker },
        { key: 'radiology', label: 'Imaging', icon: ImageIcon },
        { key: 'medication', label: 'Meds', icon: Syringe },
        { key: 'procedure', label: 'Procedures', icon: Scissors },
    ];

    const filteredOrders = useMemo(() => patient.orders.filter(o => o.category === activeCategory), [patient.orders, activeCategory]);

    const filteredCatalog = useMemo(() => {
        const items = CATALOG_ITEMS[activeCategory] || [];
        if (!searchTerm) return items;
        return items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategory, searchTerm]);

    const handleCatalogClick = (itemLabel: string) => {
        addOrderToPatient(patient.id, {
            category: activeCategory,
            label: itemLabel,
            priority: 'routine',
            instructions: activeCategory === 'medication' ? 'Review dosage before admin' : ''
        });
        setSearchTerm('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            {/* Catalog Sidebar */}
            <div className="lg:col-span-4 flex flex-col border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={`Search ${activeCategory}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 h-9 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                                    activeCategory === cat.key
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-background hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {filteredCatalog.map((item) => (
                            <button
                                key={item}
                                onClick={() => handleCatalogClick(item)}
                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors flex items-center justify-between group"
                            >
                                {item}
                                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Orders */}
            <div className="lg:col-span-8 flex flex-col border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                    <h3 className="font-semibold text-sm">Active Orders ({filteredOrders.length})</h3>
                    <Button size="sm" onClick={() => sendAllDrafts(patient.id, activeCategory)}>
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Sign & Send
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div key={order.orderId} className="flex items-center justify-between p-3 rounded-lg border bg-background shadow-sm">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{order.label}</span>
                                    {order.status === 'draft' && <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>}
                                </div>
                                {order.category === 'medication' && (
                                    <input
                                        type="text"
                                        placeholder="Add instructions..."
                                        value={order.instructions || ''}
                                        onChange={(e) => updateOrder(patient.id, order.orderId, { instructions: e.target.value })}
                                        className="mt-1 w-full text-xs bg-transparent border-none p-0 focus:ring-0 text-muted-foreground placeholder:text-muted-foreground/50"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={order.priority}
                                    onChange={e => updateOrder(patient.id, order.orderId, { priority: e.target.value as OrderPriority })}
                                    className="text-xs bg-transparent border rounded px-2 py-1"
                                >
                                    <option value="routine">Routine</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="STAT">STAT</option>
                                </select>
                                <Button
                                    size="sm"
                                    variant={order.status === 'draft' ? 'default' : 'secondary'}
                                    onClick={() => updateOrder(patient.id, order.orderId, { status: 'sent' })}
                                >
                                    {order.status === 'draft' ? 'Send' : 'Update'}
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">No active orders</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// --- MAIN PAGE COMPONENT ---

const PatientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { patients, isLoading } = usePatient();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('medview');

    // Reset scroll on tab change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };
    const patient = useMemo(() => patients.find(p => p.id === id), [patients, id]);

    if (!patient) {
        if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
        return <div className="flex items-center justify-center h-screen">Patient not found</div>;
    }

    const tabs = [
        { id: 'clinical', label: 'Clinical File', icon: FileText },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'vitals', label: 'Vitals', icon: Activity },
        { id: 'medview', label: 'MedView', icon: Pill },
        { id: 'rounds', label: 'Rounds', icon: Stethoscope },
    ] as const;

    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <PatientHeader patient={patient} onTabChange={setActiveTab} navigate={navigate} />
            <PatientJourney status={patient.status} />

            <div className="w-full px-6">
                {/* Tabs - v0 Style */}
                <div className="border-b border-border mb-6">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'clinical' && currentUser && <ClinicalFileRedesigned patient={patient} />}
                    {activeTab === 'orders' && <OrdersTab patient={patient} />}
                    {activeTab === 'vitals' && <VitalsRedesigned patient={patient} />}
                    {activeTab === 'medview' && <MedViewRedesigned patient={patient} />}
                    {activeTab === 'rounds' && <RoundsRedesigned patient={patient} />}
                </div>
            </div>
        </div>
    );
};

export default PatientDetailPage;
