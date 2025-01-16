// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";  // Add this import
// Remove analytics for now as we don't need it
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBij6Rm7noCjgQVLvclvqRc34UtY2wQLsE",
  authDomain: "squares-4e4f7.firebaseapp.com",
  databaseURL: "https://squares-4e4f7-default-rtdb.firebaseio.com/",
  projectId: "squares-4e4f7",
  storageBucket: "squares-4e4f7.firebasestorage.app",
  messagingSenderId: "138190069880",
  appId: "1:138190069880:web:57e20b7d6db4112b3c0d8d",
  measurementId: "G-7WCZ6QZVH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Remove analytics initialization
// const analytics = getAnalytics(app);

// Add these lines
const database = getDatabase(app);
export { database };