const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(process.cwd(), 'frontend')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster-relief';

mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

const centerRoutes = require('./routes/centers');
const areaRoutes = require('./routes/areas');
const roadRoutes = require('./routes/roads');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/centers', centerRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
