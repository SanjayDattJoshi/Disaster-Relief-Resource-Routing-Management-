
// models/Center.js - Relief Center Schema
const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Center name is required'],
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
    resources: {
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
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
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

// Update timestamp on save
centerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Center', centerSchema);