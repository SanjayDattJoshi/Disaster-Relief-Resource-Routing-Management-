// routes/analytics.js - Analytics & Algorithm Routes
const express = require('express');
const router = express.Router();
const Area = require('../models/Area');
const Center = require('../models/Center');
const Road = require('../models/Road');

// POST compute priorities
router.post('/compute-priorities', async (req, res) => {
    try {
        const areas = await Area.find();
        
        if (areas.length === 0) {
            return res.status(400).json({ error: 'No affected areas found' });
        }

        // Find max people for normalization
        const maxPeople = Math.max(...areas.map(a => a.peopleAffected));
        
        // Weights
        const WEIGHTS = {
            severity: 0.5,
            people: 0.3,
            access: 0.2
        };

        // Calculate priority for each area
        const updates = areas.map(async (area) => {
            const normalizedPeople = maxPeople > 0 ? area.peopleAffected / maxPeople : 0;
            const normalizedSeverity = area.severity / 5;
            
            const priorityScore = (
                WEIGHTS.severity * normalizedSeverity +
                WEIGHTS.people * normalizedPeople +
                WEIGHTS.access * area.accessDifficulty
            );

            area.priorityScore = Number(priorityScore.toFixed(3));
            return area.save();
        });

        await Promise.all(updates);
        
        const updatedAreas = await Area.find().sort({ priorityScore: -1 });
        res.json({ 
            message: 'Priorities computed successfully',
            areas: updatedAreas 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST compute route (Dijkstra)
router.post('/compute-route', async (req, res) => {
    try {
        const { startId, endId } = req.body;

        if (!startId || !endId) {
            return res.status(400).json({ error: 'Start and end locations required' });
        }

        // Get all locations (centers + areas)
        const centers = await Center.find();
        const areas = await Area.find();
        const allLocations = [...centers, ...areas];
        
        // Get all roads
        const roads = await Road.find()
            .populate('fromLocation')
            .populate('toLocation');

        // Initialize Dijkstra
        const distances = {};
        const previous = {};
        const unvisited = new Set();

        allLocations.forEach(loc => {
            distances[loc._id.toString()] = Infinity;
            previous[loc._id.toString()] = null;
            unvisited.add(loc._id.toString());
        });
        distances[startId] = 0;

        // Main Dijkstra loop
        while (unvisited.size > 0) {
            let current = null;
            let minDist = Infinity;
            
            unvisited.forEach(nodeId => {
                if (distances[nodeId] < minDist) {
                    minDist = distances[nodeId];
                    current = nodeId;
                }
            });

            if (current === null || distances[current] === Infinity) break;
            if (current === endId) break;

            unvisited.delete(current);

            // Update distances to neighbors
            roads.forEach(road => {
                if (road.isBlocked) return;

                let neighbor = null;
                const fromId = road.fromLocation._id.toString();
                const toId = road.toLocation._id.toString();

                if (fromId === current) neighbor = toId;
                else if (toId === current) neighbor = fromId;

                if (neighbor && unvisited.has(neighbor)) {
                    const alt = distances[current] + road.distance;
                    if (alt < distances[neighbor]) {
                        distances[neighbor] = alt;
                        previous[neighbor] = current;
                    }
                }
            });
        }

        // Reconstruct path
        const path = [];
        let current = endId;
        while (current !== null) {
            const loc = allLocations.find(l => l._id.toString() === current);
            if (loc) {
                path.unshift({
                    id: loc._id,
                    name: loc.name,
                    latitude: loc.latitude,
                    longitude: loc.longitude
                });
            }
            current = previous[current];
        }

        if (distances[endId] === Infinity) {
            return res.status(404).json({ 
                error: 'No route found',
                message: 'No available path between selected locations'
            });
        }

        res.json({
            path: path,
            distance: Number(distances[endId].toFixed(2)),
            found: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET statistics
router.get('/statistics', async (req, res) => {
    try {
        const centerCount = await Center.countDocuments();
        const areaCount = await Area.countDocuments();
        const roadCount = await Road.countDocuments();
        
        const areas = await Area.find();
        const totalPeople = areas.reduce((sum, area) => sum + area.peopleAffected, 0);
        
        const centers = await Center.find();
        const totalResources = centers.reduce((sum, center) => ({
            food: sum.food + center.resources.food,
            water: sum.water + center.resources.water,
            medical: sum.medical + center.resources.medical
        }), { food: 0, water: 0, medical: 0 });

        res.json({
            centers: centerCount,
            areas: areaCount,
            roads: roadCount,
            totalPeople,
            totalResources
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;