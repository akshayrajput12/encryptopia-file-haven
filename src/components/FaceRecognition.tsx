
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, User, RefreshCw, Check, X } from "lucide-react";
import * as faceapi from "face-api.js";
import { toast } from "sonner";

interface FaceRecognitionProps {
  onCapture: (faceDescriptor: Float32Array) => void;
  onCancel: () => void;
  mode: "capture" | "verify";
  storedDescriptor?: Float32Array;
}

export function FaceRecognition({ onCapture, onCancel, mode, storedDescriptor }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedFace, setDetectedFace] = useState<faceapi.FaceDetection | null>(null);
  const [matchResult, setMatchResult] = useState<"matching" | "not-matching" | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setIsModelLoading(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Error loading face-api models:", error);
        toast.error("Failed to load face recognition models");
        onCancel();
      }
    };

    loadModels();

    // Clean up
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    const setupCamera = async () => {
      if (isModelLoading) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraReady(true);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast.error("Could not access camera. Please enable camera access and try again.");
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    setupCamera();
  }, [isModelLoading]);

  // Face detection loop
  useEffect(() => {
    if (!isCameraReady || isModelLoading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    let animationFrameId: number;

    const detectFace = async () => {
      if (video.readyState === 4) {
        // Get video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Set canvas dimensions to match video
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Detect faces
        const faces = await faceapi.detectAllFaces(
          video, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();

        // Draw results
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw video frame on canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          if (faces.length > 0) {
            const face = faces[0];
            setDetectedFace(face.detection);
            
            // Draw face detection box
            const drawBox = new faceapi.draw.DrawBox(face.detection.box, { 
              boxColor: '#4ade80',
              lineWidth: 2 
            });
            drawBox.draw(canvas);
            
            // If in verify mode, check for match
            if (mode === "verify" && storedDescriptor) {
              const currentDescriptor = face.descriptor;
              const distance = faceapi.euclideanDistance(currentDescriptor, storedDescriptor);
              
              // Distance threshold for matching (lower is better match)
              const threshold = 0.5;
              setMatchResult(distance < threshold ? "matching" : "not-matching");
            }
          } else {
            setDetectedFace(null);
            setMatchResult(null);
          }
        }
      }
      
      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraReady, isModelLoading, mode, storedDescriptor]);

  // Handle capture button click
  const handleCapture = async () => {
    if (!detectedFace) {
      toast.error("No face detected. Please center your face in the camera view.");
      return;
    }

    try {
      const video = videoRef.current;
      if (!video) return;

      // Get current face descriptor
      const faces = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptors();

      if (faces.length > 0) {
        const faceDescriptor = faces[0].descriptor;
        onCapture(faceDescriptor);
      } else {
        toast.error("Face detection failed. Please try again.");
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      toast.error("Failed to process face data. Please try again.");
    }
  };

  // Handle verify button click for verification mode
  const handleVerify = () => {
    if (matchResult === "matching") {
      if (detectedFace && videoRef.current) {
        // Get current face descriptor and pass it back
        faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors()
          .then(faces => {
            if (faces.length > 0) {
              onCapture(faces[0].descriptor);
            }
          });
      }
    } else {
      toast.error("Face doesn't match. Please try again or use password.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
        {isLoading || isModelLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-10 w-10 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                {isModelLoading ? "Loading face recognition models..." : "Initializing camera..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas 
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            {mode === "verify" && matchResult && (
              <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${matchResult === "matching" ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"}`}>
                {matchResult === "matching" ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Face matched</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    <span>Face not matched</span>
                  </>
                )}
              </div>
            )}
            {!detectedFace && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/80 p-4 rounded-lg text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No face detected. Please center your face in the camera view.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        {mode === "capture" ? (
          <Button
            onClick={handleCapture}
            disabled={!detectedFace || isLoading || isModelLoading}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Capture Face
          </Button>
        ) : (
          <Button
            onClick={handleVerify}
            disabled={!detectedFace || isLoading || isModelLoading || matchResult !== "matching"}
            className="gap-2"
            variant={matchResult === "matching" ? "default" : "outline"}
          >
            <Check className="h-4 w-4" />
            Verify Face
          </Button>
        )}
      </div>
    </div>
  );
}
