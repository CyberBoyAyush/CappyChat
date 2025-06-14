/**
 * Script to setup Appwrite Database Collections
 * 
 * This script creates the required collections and their attributes
 * for the AtChat application in Appwrite.
 * 
 * Usage:
 * 1. Update .env.local with your Appwrite credentials
 * 2. Run this script: node scripts/setup-appwrite-db.js
 */

require('dotenv').config({ path: '.env.local' });
const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Secret API key from .env.local

const databases = new sdk.Databases(client);
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function createDatabase() {
    try {
        console.log(`Creating database with ID: ${databaseId}`);
        await databases.create(databaseId, 'AtChat Database', true);
        console.log('Database created successfully');
    } catch (error) {
        if (error.code === 409) {
            console.log('Database already exists, continuing...');
        } else {
            console.error('Error creating database:', error);
            throw error;
        }
    }
}

async function createThreadsCollection() {
    try {
        const collectionId = 'threads';
        console.log(`Creating '${collectionId}' collection...`);

        // Create the collection
        await databases.createCollection(
            databaseId,
            collectionId,
            'Threads',
            [
                sdk.Permission.read("user:{{userId}}"),
                sdk.Permission.write("user:{{userId}}")
            ]
        );

        // Add required attributes
        await databases.createStringAttribute(databaseId, collectionId, 'threadId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'userId', 100, true);
        await databases.createStringAttribute(databaseId, collectionId, 'title', 255, true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'updatedAt', true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'lastMessageAt', true);
        await databases.createBooleanAttribute(databaseId, collectionId, 'isPinned', false, false); // Default to false, not required

        // Create indexes for faster queries
        await databases.createIndex(databaseId, collectionId, 'threadId_index', 'key', ['threadId'], []);
        await databases.createIndex(databaseId, collectionId, 'userId_index', 'key', ['userId'], []);
        await databases.createIndex(databaseId, collectionId, 'userId_threadId_index', 'key', ['userId', 'threadId'], []);

        console.log(`Collection '${collectionId}' created successfully`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection 'threads' already exists`);
        } else {
            console.error('Error creating threads collection:', error);
            throw error;
        }
    }
}

async function createMessagesCollection() {
    try {
        const collectionId = 'messages';
        console.log(`Creating '${collectionId}' collection...`);

        // Create the collection
        await databases.createCollection(
            databaseId,
            collectionId,
            'Messages',
            [
                sdk.Permission.read("user:{{userId}}"),
                sdk.Permission.write("user:{{userId}}")
            ]
        );

        // Add required attributes
        await databases.createStringAttribute(databaseId, collectionId, 'messageId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'threadId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'userId', 100, true);
        await databases.createStringAttribute(databaseId, collectionId, 'content', 16000, true);
        await databases.createStringAttribute(databaseId, collectionId, 'role', 20, true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'createdAt', true);

        // Create indexes for faster queries
        await databases.createIndex(databaseId, collectionId, 'messageId_index', 'key', ['messageId'], []);
        await databases.createIndex(databaseId, collectionId, 'threadId_index', 'key', ['threadId'], []);
        await databases.createIndex(databaseId, collectionId, 'userId_index', 'key', ['userId'], []);
        await databases.createIndex(databaseId, collectionId, 'threadId_createdAt_index', 'key', ['threadId', 'createdAt'], []);

        console.log(`Collection '${collectionId}' created successfully`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection 'messages' already exists`);
        } else {
            console.error('Error creating messages collection:', error);
            throw error;
        }
    }
}

async function createMessageSummariesCollection() {
    try {
        const collectionId = 'message_summaries';
        console.log(`Creating '${collectionId}' collection...`);

        // Create the collection
        await databases.createCollection(
            databaseId,
            collectionId,
            'Message Summaries',
            [
                sdk.Permission.read("user:{{userId}}"),
                sdk.Permission.write("user:{{userId}}")
            ]
        );

        // Add required attributes
        await databases.createStringAttribute(databaseId, collectionId, 'summaryId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'threadId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'messageId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'userId', 100, true);
        await databases.createStringAttribute(databaseId, collectionId, 'content', 1000, true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'createdAt', true);

        // Create indexes for faster queries
        await databases.createIndex(databaseId, collectionId, 'summaryId_index', 'key', ['summaryId'], []);
        await databases.createIndex(databaseId, collectionId, 'threadId_index', 'key', ['threadId'], []);
        await databases.createIndex(databaseId, collectionId, 'messageId_index', 'key', ['messageId'], []);
        await databases.createIndex(databaseId, collectionId, 'userId_index', 'key', ['userId'], []);
        await databases.createIndex(databaseId, collectionId, 'threadId_createdAt_index', 'key', ['threadId', 'createdAt'], []);

        console.log(`Collection '${collectionId}' created successfully`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection 'message_summaries' already exists`);
        } else {
            console.error('Error creating message summaries collection:', error);
            throw error;
        }
    }
}

async function setupCollections() {
    try {
        await createDatabase();
        await createThreadsCollection();
        await createMessagesCollection();
        await createMessageSummariesCollection();
        console.log('All collections created successfully');
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

// Run the setup
setupCollections();
