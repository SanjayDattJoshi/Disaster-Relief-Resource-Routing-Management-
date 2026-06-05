// backend/seed.js - Load sample data into MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const Center = require('./models/Center');
const Area = require('./models/Area');
const Road = require('./models/Road');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster-relief';

// Sample Data
const sampleCenters = [
    {
        name: 'Haldwani Central Hub',
        latitude: 29.2183,
        longitude: 79.5130,
        resources: {
            food: 500,
            water: 1000,
            medical: 200
        },
        status: 'active'
    },
    {
        name: 'Nainital Relief Center',
        latitude: 29.3803,
        longitude: 79.4636,
        resources: {
            food: 300,
            water: 600,
            medical: 150
        },
        status: 'active'
    }
];

const sampleAreas = [
    {
        name: 'Rampur Village',
        latitude: 29.2500,
        longitude: 79.5500,
        peopleAffected: 450,
        severity: 5,
        accessDifficulty: 1,
        resourcesNeeded: {
            food: 250,
            water: 500,
            medical: 80
        },
        status: 'pending'
    },
    {
        name: 'Kathgodam Town',
        latitude: 29.2644,
        longitude: 79.5269,
        peopleAffected: 320,
        severity: 4,
        accessDifficulty: 0,
        resourcesNeeded: {
            food: 180,
            water: 350,
            medical: 60
        },
        status: 'pending'
    },
    {
        name: 'Bhowali Area',
        latitude: 29.3850,
        longitude: 79.5050,
        peopleAffected: 280,
        severity: 3,
        accessDifficulty: 1,
        resourcesNeeded: {
            food: 150,
            water: 300,
            medical: 45
        },
        status: 'pending'
    },
    {
        name: 'Mukteshwar Hills',
        latitude: 29.4717,
        longitude: 79.6473,
        peopleAffected: 180,
        severity: 4,
        accessDifficulty: 1,
        resourcesNeeded: {
            food: 100,
            water: 200,
            medical: 35
        },
        status: 'pending'
    },
    {
        name: 'Ramnagar Colony',
        latitude: 29.3942,
        longitude: 79.1289,
        peopleAffected: 220,
        severity: 2,
        accessDifficulty: 0,
        resourcesNeeded: {
            food: 120,
            water: 250,
            medical: 30
        },
        status: 'pending'
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Center.deleteMany({});
        await Area.deleteMany({});
        await Road.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Insert Centers
        const centers = await Center.insertMany(sampleCenters);
        console.log(`✅ Inserted ${centers.length} relief centers`);

        // Insert Areas
        const areas = await Area.insertMany(sampleAreas);
        console.log(`✅ Inserted ${areas.length} affected areas`);

        // Create Roads
        const sampleRoads = [
            {
                fromLocation: centers[0]._id,
                fromModel: 'Center',
                toLocation: areas[0]._id,
                toModel: 'Area',
                distance: 5.2,
                travelTime: 15,
                isBlocked: false,
                roadCondition: 'good'
            },
            {
                fromLocation: centers[0]._id,
                fromModel: 'Center',
                toLocation: areas[1]._id,
                toModel: 'Area',
                distance: 8.5,
                travelTime: 25,
                isBlocked: false,
                roadCondition: 'good'
            },
            {
                fromLocation: centers[1]._id,
                fromModel: 'Center',
                toLocation: areas[2]._id,
                toModel: 'Area',
                distance: 12.0,
                travelTime: 35,
                isBlocked: false,
                roadCondition: 'fair'
            },
            {
                fromLocation: centers[1]._id,
                fromModel: 'Center',
                toLocation: areas[3]._id,
                toModel: 'Area',
                distance: 18.5,
                travelTime: 55,
                isBlocked: true,
                roadCondition: 'damaged'
            },
            {
                fromLocation: areas[0]._id,
                fromModel: 'Area',
                toLocation: areas[1]._id,
                toModel: 'Area',
                distance: 4.0,
                travelTime: 12,
                isBlocked: false,
                roadCondition: 'good'
            },
            {
                fromLocation: areas[1]._id,
                fromModel: 'Area',
                toLocation: areas[2]._id,
                toModel: 'Area',
                distance: 15.0,
                travelTime: 40,
                isBlocked: false,
                roadCondition: 'fair'
            },
            {
                fromLocation: centers[0]._id,
                fromModel: 'Center',
                toLocation: centers[1]._id,
                toModel: 'Center',
                distance: 22.0,
                travelTime: 60,
                isBlocked: false,
                roadCondition: 'excellent'
            },
            {
                fromLocation: centers[0]._id,
                fromModel: 'Center',
                toLocation: areas[4]._id,
                toModel: 'Area',
                distance: 28.0,
                travelTime: 75,
                isBlocked: false,
                roadCondition: 'good'
            },
            {
                fromLocation: areas[2]._id,
                fromModel: 'Area',
                toLocation: areas[3]._id,
                toModel: 'Area',
                distance: 14.0,
                travelTime: 45,
                isBlocked: false,
                roadCondition: 'fair'
            }
        ];

        const roads = await Road.insertMany(sampleRoads);
        console.log(`✅ Inserted ${roads.length} road connections`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Relief Centers: ${centers.length}`);
        console.log(`   - Affected Areas: ${areas.length}`);
        console.log(`   - Road Connections: ${roads.length}`);
        console.log('\n💡 You can now start the server with: npm start\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();