
# Face Recognition Model Files

This directory contains the model files required by face-api.js for face detection, recognition, and landmark detection.

## Required Files

The following files should be present in this directory:

1. **TinyFaceDetector Model:**
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`

2. **Face Landmark Model:**
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`

3. **Face Recognition Model:**
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

## How These Files Are Used

These model files are loaded by face-api.js when the application initializes. They provide the necessary weights and configuration for:

- Detecting faces in images or video
- Identifying facial landmarks (68 points that mark facial features)
- Generating face descriptors for face recognition

## Troubleshooting

If you encounter issues with face recognition:

1. Make sure all model files are properly downloaded
2. Check that file names match exactly what the code is expecting
3. Ensure the manifest JSON files correctly point to their respective shard files
4. Watch for console errors that might indicate missing or corrupted model files
