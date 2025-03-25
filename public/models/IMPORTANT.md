
# IMPORTANT: Download Real Model Files

The placeholder files in this directory need to be replaced with the actual model files for face recognition to work properly.

## How to Get the Real Model Files

1. Download the model files from the official face-api.js repository:
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights

2. You need the following files:
   - From tiny_face_detector folder:
     - tiny_face_detector_model-shard1
     - tiny_face_detector_model-weights_manifest.json
   - From face_landmark_68 folder:
     - face_landmark_68_model-shard1
     - face_landmark_68_model-weights_manifest.json
   - From face_recognition folder:
     - face_recognition_model-shard1
     - face_recognition_model-shard2
     - face_recognition_model-weights_manifest.json

3. Place these files directly in this `/models` directory.

## Troubleshooting

If you see errors like "Based on the provided shape, [3,3,3,16], the tensor should have 432 values but has 131", it means the model files are missing or corrupted. Make sure to download the correct files.
