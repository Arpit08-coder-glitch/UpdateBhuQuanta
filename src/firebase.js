import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCdecZe6sYMlj_uv9Yq0bTpc5pb_KgPuC0",
  authDomain: "bqweb-c7e71.firebaseapp.com",
  projectId: "bqweb-c7e71",
  storageBucket: "bqweb-c7e71.firebasestorage.app",
  messagingSenderId: "518993124671",
  appId: "1:518993124671:web:eac6a988eee0562eae078a"
};

// Initialize Firebase
let app;
let auth;

try {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized:', app);
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  console.log('Firebase auth initialized:', auth);
  
  console.log('Firebase setup completed successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { auth };
export default app; 