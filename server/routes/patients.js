const express = require('express');
const router = express.Router();

let patients = [
    { id: 1, name: 'Aarav Sharma', age: 45, gender: 'Male', phone: '555-0101', complaint: 'Severe chest pain and shortness of breath', status: 'Waiting for Triage' },
    { id: 2, name: 'Diya Patel', age: 32, gender: 'Female', phone: '555-0102', complaint: 'Fever, cough, and body aches for 3 days', status: 'Waiting for Doctor' },
    { id: 3, name: 'Vihaan Singh', age: 28, gender: 'Male', phone: '555-0103', complaint: 'Fell off a ladder, arm is deformed and painful', status: 'In Treatment' },
];

// Get all patients
router.get('/', (req, res) => {
    res.json(patients);
});

// Create a new patient
router.post('/', (req, res) => {
    const newPatient = { id: Date.now(), ...req.body };
    patients.push(newPatient);
    res.status(201).json(newPatient);
});

// Get a patient by ID
router.get('/:id', (req, res) => {
    const patient = patients.find(p => p.id === parseInt(req.params.id));
    if (!patient) return res.status(404).send('Patient not found');
    res.json(patient);
});

// Update a patient
router.put('/:id', (req, res) => {
    const patientIndex = patients.findIndex(p => p.id === parseInt(req.params.id));
    if (patientIndex === -1) return res.status(404).send('Patient not found');

    patients[patientIndex] = { ...patients[patientIndex], ...req.body };
    res.json(patients[patientIndex]);
});

// Delete a patient
router.delete('/:id', (req, res) => {
    const patientIndex = patients.findIndex(p => p.id === parseInt(req.params.id));
    if (patientIndex === -1) return res.status(404).send('Patient not found');

    const deletedPatient = patients.splice(patientIndex, 1);
    res.json(deletedPatient);
});

module.exports = router;
