// models/Road.js - Road Network Schema
const mongoose = require('mongoose');

const roadSchema = new mongoose.Schema({
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'From location is required'],
        refPath: 'fromModel'
    },
    fromModel: {
        type: String,
        required: true,
        enum: ['Center', 'Area']
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'To location is required'],
        refPath: 'toModel'
    },
    toModel: {
        type: String,
        required: true,
        enum: ['Center', 'Area']
    },
    distance: {
        type: Number,
        required: [true, 'Distance is required'],
        min: 0
    },
    travelTime: {
        type: Number,
        required: [true, 'Travel time is required'],
        min: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    roadCondition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
        default: 'good'
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

roadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient querying
roadSchema.index({ fromLocation: 1, toLocation: 1 });

module.exports = mongoose.model('Road', roadSchema);