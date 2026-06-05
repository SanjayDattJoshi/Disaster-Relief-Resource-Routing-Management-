
// routes/centers.js - Relief Center Routes
const express = require('express');
const router = express.Router();
const Center = require('../models/Center');

// GET all centers
router.get('/', async (req, res) => {
    try {
        const centers = await Center.find().sort({ createdAt: -1 });
        res.json(centers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single center by ID
router.get('/:id', async (req, res) => {
    try {
        const center = await Center.findById(req.params.id);
        if (!center) {
            return res.status(404).json({ error: 'Center not found' });
        }
        res.json(center);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new center
router.post('/', async (req, res) => {
    try {
        const center = new Center({
            name: req.body.name,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            resources: {
                food: req.body.food || 0,
                water: req.body.water || 0,
                medical: req.body.medical || 0
            }
        });
        const savedCenter = await center.save();
        res.status(201).json(savedCenter);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update center
router.put('/:id', async (req, res) => {
    try {
        const center = await Center.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                resources: {
                    food: req.body.food,
                    water: req.body.water,
                    medical: req.body.medical
                },
                status: req.body.status
            },
            { new: true, runValidators: true }
        );
        if (!center) {
            return res.status(404).json({ error: 'Center not found' });
        }
        res.json(center);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE center
router.delete('/:id', async (req, res) => {
    try {
        const center = await Center.findByIdAndDelete(req.params.id);
        if (!center) {
            return res.status(404).json({ error: 'Center not found' });
        }
        res.json({ message: 'Center deleted successfully', center });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;