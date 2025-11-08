


export type Role = 'Intern' | 'Doctor' | 'Admin';
export type TriageLevel = 'Red' | 'Yellow' | 'Green' | 'None';
export type PatientStatus = 'Waiting for Triage' | 'Waiting for Doctor' | 'In Treatment' | 'Discharged';
export type Department = 'Cardiology' | 'Orthopedics' | 'General Medicine' | 'Obstetrics' | 'Neurology' | 'Emergency' | 'Unknown';

// Phase 3: User model for authentication
export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

// Phase 3+: Expanded Audit logging for detailed actions
export type AuditEventAction = 'accept' | 'modify' | 'reject' | 'view' | 'create' | 'signoff' | 'cancel';
export type AuditEventEntity = 'patient_record' | 'history_section' | 'order' | 'soap_note' | 'team_note' | 'checklist' | 'clinical_file' | 'round' | 'discharge_summary' | 'vitals';

export interface AuditEvent {
    id: string;
    userId: string;
    patientId: string;
    action: AuditEventAction;
    entity: AuditEventEntity;
    entityId?: string; // e.g., the ID of the note or order
    payload?: {
      aiModel?: string;
      originalSuggestion?: any;
      finalContent?: any;
      [key: string]: any; // For other details
    };
    timestamp: string;
}


export interface Vitals {
  hr: number; // Heart Rate
  bpSys: number; // Blood Pressure Systolic
  bpDia: number; // Blood Pressure Diastolic
  rr: number; // Respiratory Rate
  spo2: number; // Oxygen Saturation
  temp: number; // Temperature (Celsius)
}

// NEW VITALS DATA STRUCTURE (Vitals Tab)
export interface VitalsMeasurements {
    temp_c?: number | null;
    pulse?: number | null; // Replaces hr
    rr?: number | null;
    bp_sys?: number | null;
    bp_dia?: number | null;
    spo2?: number | null;
    glucose_mg_dl?: number | null;
    pain_score?: number | null; // 0-10
    urine_output_ml?: number | null;
}


export interface VitalsRecord {
  vitalId: string;
  patientId: string;
  recordedBy: string; // userId
  recordedAt: string; // iso_timestamp
  source: 'nurse' | 'monitor' | 'manual' | 'device';
  measurements: VitalsMeasurements;
  observations?: string | null;
  tags?: ('pre-op' | 'post-op')[];
  linkedOrders?: string[];
  meta?: { deviceId: string | null; imported: boolean };
}


export interface Triage {
  level: TriageLevel;
  reasons: string[];
}

export interface AITriageSuggestion {
    department: Department;
    suggested_triage: TriageLevel;
    confidence: number;
}

// Phase 2: New Data Structures
export interface SOAPNote {
    type: 'SOAP';
    id: string;
    patientId: string;
    author: string; // Name of author
    authorId: string; // ID of author
    role: Role;
    timestamp: string;
    transcript?: string;
    s: string; // Subjective
    o: string; // Objective
    a: string; // Assessment
    p: string; // Plan
    aiMeta?: Record<string, any>;
}

export interface TeamNote {
    type: 'TeamNote';
    id: string;
    patientId: string;
    author: string;
    authorId: string;
    role: Role;
    content: string;
    isEscalation?: boolean;
    timestamp: string;
}

export interface Checklist {
    type: 'Checklist';
    id: string;
    patientId: string;
    author: string;
    authorId: string;
    role: Role;
    title: string;
    items: { text: string; checked: boolean }[];
    timestamp: string;
}

export type TimelineEvent = SOAPNote | TeamNote | Checklist;

// --- ORDERS (Phase 3+ / Patient Workspace) ---
export type OrderCategory = 'investigation' | 'radiology' | 'medication' | 'procedure' | 'nursing' | 'referral';
export type OrderPriority = 'routine' | 'urgent' | 'STAT';
export type OrderStatus = 'draft' | 'sent' | 'scheduled' | 'in_progress' | 'completed' | 'resulted' | 'cancelled';

export interface Order {
    orderId: string;
    patientId: string;
    createdBy: string; // userId
    createdAt: string; // iso_datetime
    linkedSnapshotId?: string | null;
    category: OrderCategory;
    subType: string; // e.g., CBC, Chest X-ray, Paracetamol
    code?: string | null; // LOINC / internal code if available
    label: string; // human label
    payload: {
        // investigations
        sampleType?: string;
        collectionInstructions?: string;
        // radiology
        modality?: string;
        region?: string;
        contrast?: boolean;
        // medication
        dose?: string;
        route?: string;
        frequency?: string;
        duration?: string;
        prn?: boolean;
        // procedure
        details?: string;
        consentRequired?: boolean;
        // nursing
        task?: string;
        // referral
        specialty?: string;
        reason?: string;
    };
    priority: OrderPriority;
    status: OrderStatus;
    scheduledFor?: string | null;
    resultRef?: {
        resultId: string | null;
        summary: string | null;
        reportUrl: string | null;
    };
    ai_provenance?: {
        prompt_id: string | null;
        rationale: string | null;
    };
    history?: {
        timestamp: string; // iso
        userId: string;
        action: string; // created|updated|status_changed|cancelled|override
        details?: any;
    }[];
    meta?: {
        lastModified: string;
        modifiedBy: string; // userId
    };
}

// --- NEW RESULTS DATA STRUCTURE ---
export interface Result {
    resultId: string;
    patientId: string;
    orderId: string;
    type: 'lab' | 'imaging';
    name: string;
    timestamp: string;
    status: 'final' | 'preliminary';
    isAbnormal: boolean;
    value: string;
    unit?: string;
    referenceRange?: string;
    delta?: {
        previousValue: string;
        change: 'increase' | 'decrease' | 'stable';
    };
    reportUrl?: string;
}


export interface Round {
    roundId: string;
    patientId: string;
    doctorId: string;
    createdAt: string; // iso_timestamp
    status: 'draft' | 'signed';
    subjective: string;
    objective: string;
    assessment: string;
    plan: {
        text: string;
        linkedOrders: string[];
    };
    linkedResults: string[];
    ai_provenance?: {
        prompt_id: string | null;
        action: 'generate_soap' | 'summarize_changes' | null;
    };
    signedBy: string | null; // userId
    signedAt: string | null; // iso_timestamp
}


export interface PatientOverview {
    summary: string;
    vitalsSnapshot: string;
    activeOrders: string;
    recentResults: string;
}

export interface FollowUpQuestion {
    id: string;
    text: string;
    answer_type: 'text' | 'options';
    quick_options?: string[];
    rationale?: string;
}

export interface ComposedHistory {
    paragraph: string;
}

// --- NEW CLINICAL FILE DATA STRUCTURE ---

export interface Allergy {
    substance: string;
    reaction: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | '';
}

export interface HistorySectionData {
    chief_complaint: string;
    duration: string;
    hpi: string;
    associated_symptoms: string[];
    past_medical_history: string;
    past_surgical_history: string;
    drug_history: string;
    allergy_history: Allergy[];
    family_history: string;
    personal_social_history: string;
    menstrual_obstetric_history: string;
    socioeconomic_lifestyle: string;
    review_of_systems: { [key: string]: boolean | string };
}

export interface GPESectionData {
    general_appearance: 'well' | 'ill' | 'toxic' | 'cachectic' | '';
    vitals: Partial<VitalsMeasurements>; // Updated from Vitals
    build: 'normal' | 'obese' | 'cachectic' | '';
    hydration: 'normal' | 'mild' | 'moderate' | 'severe' | '';
    flags: {
        pallor: boolean;
        icterus: boolean;
        cyanosis: boolean;
        clubbing: boolean;
        lymphadenopathy: boolean;
        edema: boolean;
    };
    height_cm: number;
    weight_kg: number;
    bmi: number;
    remarks: string;
    aiGeneratedSummary?: string;
}

export interface SystemicExamSystemData {
    autofill?: boolean;
    inspection: string;
    palpation: string;
    percussion: string;
    auscultation: string;
    summary: string;
}

export interface SystemicExamSectionData {
    cvs?: Partial<SystemicExamSystemData>;
    rs?: Partial<SystemicExamSystemData>;
    cns?: Partial<SystemicExamSystemData>;
    abdomen?: Partial<SystemicExamSystemData>;
    msk?: Partial<SystemicExamSystemData>;
    skin?: Partial<SystemicExamSystemData>;
    other?: Partial<SystemicExamSystemData>;
}

export interface ClinicalFileSections {
    history: Partial<HistorySectionData>;
    gpe: Partial<GPESectionData>;
    systemic: Partial<SystemicExamSectionData>;
}

export interface AISuggestionHistory {
    chief_complaint?: string;
    duration?: string;
    associated_symptoms?: string[];
    structured_hpi?: string;
    past_medical_history?: string;
    allergy_history?: Allergy[];
    family_history?: string;
    followUpQuestions?: {
        [fieldKey: string]: FollowUpQuestion[];
    };
    followUpAnswers?: {
        [fieldKey: string]: Record<string, string>; // questionId -> answer
    };
}


export interface ClinicalFile {
    id: string;
    patientId: string;
    status: 'draft' | 'signed';
    signedAt?: string;
    signedBy?: string; // User ID
    aiSummary?: string;
    missingInfo?: string[]; // For AI feedback
    crossCheckInconsistencies?: string[];
    aiSuggestions?: {
        history?: Partial<AISuggestionHistory>;
    };
    sections: ClinicalFileSections;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  complaint: string;
  status: PatientStatus;
  vitals?: VitalsMeasurements;
  vitalsHistory: VitalsRecord[];
  triage: Triage;
  aiTriage?: AITriageSuggestion & { fromCache?: boolean };
  registrationTime: string;
  timeline: TimelineEvent[];
  // Patient Workspace fields
  overview?: PatientOverview;
  clinicalFile: ClinicalFile;
  orders: Order[];
  results: Result[];
  rounds: Round[];
  dischargeSummary?: {
    draft: string;
    finalized?: string;
  };
}

export type Page = 'dashboard' | 'reception' | 'triage' | 'patientDetail';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: string[];
    isLoading?: boolean;
}

export type AppContextType = {
    page: Page;
    setPage: (page: Page) => void;
    currentUser: User;
    setUser: (user: User) => void;
    patients: Patient[];
    auditLog: AuditEvent[];
    addPatient: (patientData: Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals'>) => Promise<void>;
    updatePatientVitals: (patientId: string, vitals: Vitals) => Promise<void>;
    addNoteToPatient: (patientId: string, content: string, isEscalation?: boolean) => Promise<void>;
    addSOAPNoteToPatient: (patientId: string, soapData: Omit<SOAPNote, 'id' | 'type' | 'patientId' | 'timestamp' | 'author' | 'authorId' | 'role'>, originalSuggestion: any) => Promise<void>;
    addChecklistToPatient: (patientId: string, title: string, items: string[]) => Promise<void>;
    updatePatientComplaint: (patientId: string, newComplaint: string) => void;
    logAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
    toggleChecklistItem: (patientId: string, checklistId: string, itemIndex: number) => void;
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string | null) => void;
    isLoading: boolean;
    error: string | null;
    chatHistory: ChatMessage[];
    sendChatMessage: (message: string, patientContextId?: string | null) => Promise<void>;
    // Patient Workspace functions
    signOffClinicalFile: (patientId: string) => Promise<void>;
    updateOrder: (patientId: string, orderId: string, updates: Partial<Order>) => void;
    acceptAIOrders: (patientId: string, orderIds: string[]) => void;
    sendAllDrafts: (patientId: string, category: OrderCategory) => void;
    addVitalsRecord: (patientId: string, entryData: Pick<VitalsRecord, 'measurements' | 'observations' | 'source'>) => void;
    generateDischargeSummary: (patientId: string) => Promise<void>;
    addOrderToPatient: (patientId: string, order: Partial<Order>) => void;
    generatePatientOverview: (patientId: string) => Promise<void>;
    summarizePatientClinicalFile: (patientId: string) => Promise<void>;
    summarizeVitals: (patientId: string) => Promise<string | null>;
    // Rounds Functions
    createDraftRound: (patientId: string) => Promise<Round>;
    updateDraftRound: (patientId: string, roundId: string, updates: Partial<Round>) => void;
    signOffRound: (patientId: string, roundId: string) => Promise<void>;
    // Clinical File Tab Functions
    updateClinicalFileSection: <K extends keyof ClinicalFileSections>(
        patientId: string, 
        sectionKey: K, 
        data: Partial<ClinicalFileSections[K]>
    ) => void;
    formatHpi: (patientId: string) => Promise<void>;
    checkMissingInfo: (patientId: string, sectionKey: keyof ClinicalFileSections) => void;
    summarizeSection: (patientId: string, sectionKey: keyof ClinicalFileSections) => Promise<void>;
    crossCheckFile: (patientId: string) => Promise<void>;
    acceptAISuggestion: (patientId: string, field: keyof AISuggestionHistory) => void;
    clearAISuggestions: (patientId: string, section: 'history') => void;
    getFollowUpQuestions: (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData, seedText: string) => Promise<void>;
    updateFollowUpAnswer: (patientId: string, fieldKey: keyof HistorySectionData, questionId: string, answer: string) => void;
    composeHistoryWithAI: (patientId: string, sectionKey: 'history', fieldKey: keyof HistorySectionData) => Promise<void>;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
};