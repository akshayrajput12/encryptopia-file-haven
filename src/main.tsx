
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as faceapi from 'face-api.js';

// Preload face-api.js models 
async function preloadModels() {
  try {
    console.log("Preloading face-api.js models...");
    
    // Set custom model path
    const MODEL_URL = '/models';

    // Load models synchronously one by one to avoid simultaneous loading issues
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    console.log("Tiny face detector model loaded");
    
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log("Face landmark model loaded");
    
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("Face recognition model loaded");
    
    console.log("Face-api.js models preloaded successfully");
  } catch (error) {
    console.error("Error preloading face-api.js models:", error);
  }
}

// Init app
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Preload models and then render app
preloadModels().then(renderApp);
