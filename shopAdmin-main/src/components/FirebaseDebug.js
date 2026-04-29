/**
 * Firebase Debug Component
 * 
 * This component helps debug Firebase connection issues by:
 * - Checking environment variables
 * - Testing Firestore connection
 * - Displaying sample data structure
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const FirebaseDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    envVars: {},
    connection: null,
    sampleData: null,
    error: null
  });

  useEffect(() => {
    const runDebugTests = async () => {
      // Check environment variables
      const envVars = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
        appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
      };

      console.log('🔍 Firebase Debug: Environment Variables:', envVars);
      console.log('🔍 Firebase Debug: Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);

      // Test Firestore connection
      try {
        console.log('🔍 Firebase Debug: Testing Firestore connection...');
        const ordersRef = collection(db, 'orders');
        const snapshot = await getDocs(query(ordersRef, limit(1)));
        
        const connectionInfo = {
          status: '✅ Connected',
          documentsFound: snapshot.docs.length,
          collectionExists: snapshot.docs.length > 0 ? '✅ Yes' : '❌ No'
        };

        let sampleData = null;
        if (snapshot.docs.length > 0) {
          sampleData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          };
          console.log('🔍 Firebase Debug: Sample document:', sampleData);
        }

        setDebugInfo({
          envVars,
          connection: connectionInfo,
          sampleData,
          error: null
        });

      } catch (error) {
        console.error('🔍 Firebase Debug: Connection failed:', error);
        setDebugInfo({
          envVars,
          connection: {
            status: '❌ Failed',
            error: error.message
          },
          sampleData: null,
          error: error.message
        });
      }
    };

    runDebugTests();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4">🔍 Firebase Debug Information</h3>
      
      {/* Environment Variables */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Environment Variables:</h4>
        <div className="bg-white p-3 rounded border">
          {Object.entries(debugInfo.envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span>{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Firestore Connection:</h4>
        <div className="bg-white p-3 rounded border">
          {debugInfo.connection ? (
            <>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>{debugInfo.connection.status}</span>
              </div>
              {debugInfo.connection.documentsFound !== undefined && (
                <div className="flex justify-between">
                  <span>Documents Found:</span>
                  <span>{debugInfo.connection.documentsFound}</span>
                </div>
              )}
              {debugInfo.connection.collectionExists && (
                <div className="flex justify-between">
                  <span>Collection Exists:</span>
                  <span>{debugInfo.connection.collectionExists}</span>
                </div>
              )}
              {debugInfo.connection.error && (
                <div className="text-red-600 mt-2">
                  Error: {debugInfo.connection.error}
                </div>
              )}
            </>
          ) : (
            <div>Testing...</div>
          )}
        </div>
      </div>

      {/* Sample Data */}
      {debugInfo.sampleData && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Sample Document:</h4>
          <div className="bg-white p-3 rounded border">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo.sampleData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Information */}
      {debugInfo.error && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
          <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800">
            {debugInfo.error}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseDebug; 