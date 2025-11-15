const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const patientRoutes = require('./routes/patients');

app.use('/api/patients', patientRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the Medflow AI backend!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
