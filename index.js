require('dotenv').config();
const express = require('express');
const generateRoute = require('./routes/generate');

const app = express();
app.use(express.json());

app.use('/', generateRoute);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));