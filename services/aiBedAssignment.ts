
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Patient, Ward, Bed } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export interface BedRecommendation {
    recommended_ward_id: string;
    recommended_room_id: string;
    recommended_bed_id: string;
    reasoning: string;
}

export interface DischargePrediction {
    predicted_hours: number;
    confidence: number;
    factors: string[];
}

export const recommendBed = async (patient: Patient, wards: Ward[]): Promise<BedRecommendation> => {
    try {
        // Filter for vacant beds to reduce token count
        const vacantBeds = wards.flatMap(w =>
            w.rooms.flatMap(r =>
                r.beds.filter(b => b.status === 'vacant').map(b => ({
                    wardId: w.id,
                    wardName: w.name,
                    dept: w.department,
                    roomId: r.id,
                    bedId: b.id
                }))
            )
        );

        if (vacantBeds.length === 0) {
            throw new Error("No vacant beds available.");
        }

        // We'll send a subset of vacant beds if too many, to avoid context limit (though 500 is fine for Gemini 1.5/2.0)
        // For efficiency, let's group by ward and send counts + a few examples.
        // Actually, for "best bed", we need specific locations. Let's send all vacant beds but simplified.

        const prompt = `
        You are an expert Bed Manager AI for a hospital.
        
        Patient Profile:
        - Name: ${patient.name}
        - Age: ${patient.age}
        - Gender: ${patient.gender}
        - Chief Complaint: ${patient.chiefComplaints.map(c => c.complaint).join(', ')}
        - Triage Level: ${patient.triage.level}
        - AI Suggested Dept: ${patient.aiTriage?.department || 'Unknown'}
        - Infectious Risk: ${patient.activeProblems?.some(p => p.description.toLowerCase().includes('infect')) ? 'High' : 'Low'}
        
        Available Vacant Beds:
        ${JSON.stringify(vacantBeds.slice(0, 50))} 
        (List truncated to first 50 vacant beds for brevity if long)

        Task: Recommend the single best bed for this patient.
        Rules:
        1. Match patient department to ward department if possible.
        2. ICU patients go to ICU.
        3. Infectious patients should ideally be in isolated rooms or specific wards (infer from context).
        4. Provide clear reasoning.

        Output JSON only:
        {
            "recommended_ward_id": "string",
            "recommended_room_id": "string",
            "recommended_bed_id": "string",
            "reasoning": "string"
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = result.response;
        return JSON.parse(response.text()) as BedRecommendation;

    } catch (error) {
        console.error("AI Bed Recommendation failed:", error);
        // Fallback: Return first available bed
        const firstWard = wards.find(w => w.rooms.some(r => r.beds.some(b => b.status === 'vacant')));
        if (firstWard) {
            const firstRoom = firstWard.rooms.find(r => r.beds.some(b => b.status === 'vacant'));
            const firstBed = firstRoom?.beds.find(b => b.status === 'vacant');
            return {
                recommended_ward_id: firstWard.id,
                recommended_room_id: firstRoom!.id,
                recommended_bed_id: firstBed!.id,
                reasoning: "Fallback: AI unavailable, assigned first vacant bed."
            };
        }
        throw new Error("No beds available.");
    }
};

export const predictDischarge = async (patient: Patient): Promise<DischargePrediction> => {
    try {
        const prompt = `
        Predict discharge time (in hours from now) for this patient.
        
        Patient Data:
        - Age: ${patient.age}
        - Admission: ${patient.registrationTime}
        - Triage: ${patient.triage.level}
        - Vitals Stable: ${patient.vitalsHistory.length > 0 ? 'Yes' : 'No data'}
        - Active Orders: ${patient.orders.filter(o => o.status !== 'completed').length}
        - Pending Labs: ${patient.orders.filter(o => o.category === 'investigation' && o.status !== 'resulted').length}
        
        Output JSON only:
        {
            "predicted_hours": number,
            "confidence": number (0-1),
            "factors": ["string", "string"]
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        return JSON.parse(result.response.text()) as DischargePrediction;

    } catch (error) {
        console.error("AI Discharge Prediction failed:", error);
        return {
            predicted_hours: 24,
            confidence: 0.5,
            factors: ["Default prediction (AI unavailable)"]
        };
    }
};
