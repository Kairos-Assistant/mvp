import express from 'express';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Firebase Admin Initialization
try {
  const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
  
  if (existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('✅ Firebase Admin initialized with service account file.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized via environment variable.');
  } else {
    // Fallback for environments where service account is provided via env vars (like CI/Vercel)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
    console.log('ℹ️ Firebase Admin initialized with application default credentials.');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}

const db = admin.firestore();

app.use(express.json());

// Test Connection Endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Attempting to connect to Firestore project:', admin.app().options.projectId);
    const testDoc = await db.collection('test').doc('connection').get();
    
    if (!testDoc.exists) {
      console.log('Test document not found, creating one...');
      await db.collection('test').doc('connection').set({
        status: 'connected',
        lastTested: admin.firestore.Timestamp.now(),
        message: 'Backend successfully connected to Firestore!'
      });
      return res.json({ message: 'Success! Created a new test document.' });
    }
    
    res.json({ 
      message: 'Success! Connected to Firestore.', 
      data: testDoc.data() 
    });
  } catch (error) {
    console.error('Full Firestore Test Error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Firestore', 
      details: error instanceof Error ? error.stack : String(error),
      code: (error as any).code,
      metadata: (error as any).metadata
    });
  }
});

// Simple Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});
