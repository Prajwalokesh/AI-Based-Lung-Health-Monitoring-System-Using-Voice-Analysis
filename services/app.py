from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import numpy as np
try:
    import librosa
except Exception:
    librosa = None
try:
    from tensorflow.keras.models import load_model
except Exception:
    load_model = None

app = FastAPI(title="Model Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_keras_model():
    model_paths = [
        os.path.join(os.path.dirname(__file__), "models", "final_optimized_model.keras"),
        os.path.join(os.path.dirname(__file__), "models", "model.h5"),
    ]
    for p in model_paths:
        if os.path.exists(p) and load_model is not None:
            return load_model(p)
    return None


MODEL = load_keras_model()

# Human readable class labels (from training notebook)
CLASS_NAMES = [
    "Asthma",
    "Bronchiectasis",
    "Bronchiolitis",
    "COPD",
    "Healthy",
    "LRTI",
    "Pneumonia",
    "URTI",
]


def preprocess_audio(file_bytes, sr_target=None, n_mfcc=40):
    """Preprocess audio to match training pipeline in the notebook.

    Steps:
    - load audio with librosa
    - compute MFCCs with `n_mfcc` coefficients
    - aggregate across time by taking the mean for each MFCC (shape -> (n_mfcc,))
    - reshape to (1, n_mfcc, 1, 1) which matches the notebook's training input
    """
    if librosa is None:
        raise RuntimeError("librosa not installed")
    import io
    audio, sr = librosa.load(io.BytesIO(file_bytes), sr=sr_target)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    # aggregate across time frames to a single vector per sample
    mfcc_mean = np.mean(mfcc, axis=1)
    # reshape to (1, n_mfcc, 1, 1) per notebook convention
    X = mfcc_mean.reshape(1, n_mfcc, 1, 1).astype(np.float32)
    return X


@app.post("/predict-health")
async def predict_health(
    file: UploadFile = File(...),
):
    if MODEL is None:
        return JSONResponse(status_code=500, content={"error": "Model not loaded on server"})

    contents = await file.read()
    try:
        X = preprocess_audio(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio preprocessing failed: {e}")

    try:
        preds = MODEL.predict(X)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    try:
        probs = np.array(preds)
        predicted_index = int(np.argmax(probs, axis=1)[0])
        probs_list = probs.tolist()
    except Exception:
        # fallback: try to coerce
        probs_list = preds.tolist() if hasattr(preds, "tolist") else [float(x) for x in preds]
        predicted_index = 0

    # map to human-readable label when available
    if 0 <= predicted_index < len(CLASS_NAMES):
        predicted_label = CLASS_NAMES[predicted_index]
    else:
        predicted_label = str(predicted_index)

    # probabilities for each class
    class_probabilities = None
    try:
        # if probs_list is shape (1, n_classes)
        class_probabilities = dict(zip(CLASS_NAMES, probs_list[0]))
    except Exception:
        class_probabilities = {str(i): float(p) for i, p in enumerate(probs_list[0] if isinstance(probs_list[0], list) else probs_list)}

    response = {
        "prediction": {
            "predicted_index": predicted_index,
            "predicted_label": predicted_label,
            "probabilities": class_probabilities,
        },
    }

    return response


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
