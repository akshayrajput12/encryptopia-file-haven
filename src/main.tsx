
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

    // Load models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
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
