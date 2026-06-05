// models/Area.js - Affected Area Schema
const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Area name is required'],
        trim: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
    },
    peopleAffected: {
        type: Number,
        required: [true, 'Number of people affected is required'],
        min: 0
    },
    severity: {
        type: Number,
        required: [true, 'Severity level is required'],
        min: 1,
        max: 5
    },
    accessDifficulty: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    resourcesNeeded: {
        food: {
            type: Number,
            default: 0,
            min: 0
        },
        water: {
            type: Number,
            default: 0,
            min: 0
        },
        medical: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    priorityScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

areaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Area', areaSchema);