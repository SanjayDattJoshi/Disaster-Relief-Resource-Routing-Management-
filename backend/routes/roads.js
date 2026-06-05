// routes/roads.js - Road Network Routes
const express = require('express');
const router = express.Router();
const Road = require('../models/Road');

// GET all roads
router.get('/', async (req, res) => {
    try {
        const roads = await Road.find()
            .populate('fromLocation')
            .populate('toLocation')
            .sort({ createdAt: -1 });
        res.json(roads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single road
router.get('/:id', async (req, res) => {
    try {
        const road = await Road.findById(req.params.id)
            .populate('fromLocation')
            .populate('toLocation');
        if (!road) {
            return res.status(404).json({ error: 'Road not found' });
        }
        res.json(road);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new road
router.post('/', async (req, res) => {
    try {
        const road = new Road({
            fromLocation: req.body.fromLocation,
            fromModel: req.body.fromModel,
            toLocation: req.body.toLocation,
            toModel: req.body.toModel,
            distance: req.body.distance,
            travelTime: req.body.travelTime,
            isBlocked: req.body.isBlocked || false,
            roadCondition: req.body.roadCondition || 'good'
        });
        const savedRoad = await road.save();
        const populatedRoad = await Road.findById(savedRoad._id)
            .populate('fromLocation')
            .populate('toLocation');
        res.status(201).json(populatedRoad);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update road
router.put('/:id', async (req, res) => {
    try {
        const road = await Road.findByIdAndUpdate(
            req.params.id,
            {
                distance: req.body.distance,
                travelTime: req.body.travelTime,
                isBlocked: req.body.isBlocked,
                roadCondition: req.body.roadCondition
            },
            { new: true, runValidators: true }
        ).populate('fromLocation').populate('toLocation');
        
        if (!road) {
            return res.status(404).json({ error: 'Road not found' });
        }
        res.json(road);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE road
router.delete('/:id', async (req, res) => {
    try {
        const road = await Road.findByIdAndDelete(req.params.id);
        if (!road) {
            return res.status(404).json({ error: 'Road not found' });
        }
        res.json({ message: 'Road deleted successfully', road });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;