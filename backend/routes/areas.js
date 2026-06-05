// routes/areas.js - Affected Area Routes
const express = require('express');
const router = express.Router();
const Area = require('../models/Area');

// GET all areas
router.get('/', async (req, res) => {
    try {
        const areas = await Area.find().sort({ priorityScore: -1 });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single area
router.get('/:id', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        res.json(area);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new area
router.post('/', async (req, res) => {
    try {
        const area = new Area({
            name: req.body.name,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            peopleAffected: req.body.peopleAffected,
            severity: req.body.severity,
            accessDifficulty: req.body.accessDifficulty || 0,
            resourcesNeeded: {
                food: req.body.food || 0,
                water: req.body.water || 0,
                medical: req.body.medical || 0
            }
        });
        const savedArea = await area.save();
        res.status(201).json(savedArea);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update area
router.put('/:id', async (req, res) => {
    try {
        const area = await Area.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                peopleAffected: req.body.peopleAffected,
                severity: req.body.severity,
                accessDifficulty: req.body.accessDifficulty,
                resourcesNeeded: {
                    food: req.body.food,
                    water: req.body.water,
                    medical: req.body.medical
                },
                priorityScore: req.body.priorityScore,
                status: req.body.status
            },
            { new: true, runValidators: true }
        );
        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        res.json(area);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE area
router.delete('/:id', async (req, res) => {
    try {
        const area = await Area.findByIdAndDelete(req.params.id);
        if (!area) {
            return res.status(404).json({ error: 'Area not found' });
        }
        res.json({ message: 'Area deleted successfully', area });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;