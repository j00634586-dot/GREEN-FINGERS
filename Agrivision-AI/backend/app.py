from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from pathlib import Path
from datetime import datetime
import uuid

# =========================================================
# GREEN FINGERS - AI AGRICULTURE BACKEND
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
UPLOAD_DIR = BASE_DIR / "uploads"
MODEL_DIR = BASE_DIR / "model"

UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

app = Flask(__name__)

# Maximum image size = 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


# =========================================================
# FILE VALIDATION
# =========================================================

def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# =========================================================
# DEMO AI PREDICTION
# =========================================================

def create_prediction(filename):

    name = filename.lower()

    # Healthy
    if "healthy" in name:
        return {
            "crop": "Tomato",
            "disease": "Healthy Leaf",
            "confidence": 97,
            "severity": "Low",
            "description": "The uploaded leaf appears healthy with no major visible disease pattern.",
            "evidence": [
                "Healthy green leaf surface",
                "No major circular lesions detected",
                "No significant discoloration visible"
            ],
            "advice": [
                "Continue regular crop monitoring.",
                "Maintain proper irrigation.",
                "Keep the field clean and well ventilated."
            ]
        }

    # Late Blight
    if "late" in name:
        return {
            "crop": "Tomato",
            "disease": "Late Blight",
            "confidence": 92,
            "severity": "High",
            "description": "Visual patterns are consistent with a possible late-blight-like condition.",
            "evidence": [
                "Dark irregular leaf regions",
                "Visible brown discoloration",
                "Disease-like texture variation"
            ],
            "advice": [
                "Remove severely affected leaves.",
                "Improve air circulation around plants.",
                "Avoid prolonged leaf wetness.",
                "Consult a local agriculture expert before treatment."
            ]
        }

    # Pest
    if "pest" in name or "insect" in name:
        return {
            "crop": "Tomato",
            "disease": "Pest Damage",
            "confidence": 89,
            "severity": "Medium",
            "description": "The image contains patterns that may be associated with insect or pest damage.",
            "evidence": [
                "Irregular damaged leaf areas",
                "Small localized affected regions",
                "Visible leaf texture changes"
            ],
            "advice": [
                "Inspect the underside of leaves.",
                "Check nearby plants for similar symptoms.",
                "Remove heavily damaged leaves.",
                "Use locally approved pest-management practices."
            ]
        }

    # Default
    return {
        "crop": "Tomato",
        "disease": "Early Blight",
        "confidence": 94,
        "severity": "High",
        "description": "Brown spot and discoloration patterns are visually consistent with an early-blight-like pattern.",
        "evidence": [
            "Brown circular spot-like regions",
            "Visible discoloration",
            "Disease-like leaf texture variation"
        ],
        "advice": [
            "Remove severely affected leaves.",
            "Improve air circulation around plants.",
            "Avoid prolonged leaf wetness.",
            "Consult a local agriculture expert before treatment."
        ]
    }


# =========================================================
# HOME - FRONTEND
# =========================================================

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


# =========================================================
# FRONTEND FILES
# =========================================================

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "project": "Green Fingers",
        "status": "Backend is running",
        "message": "Green Fingers AI backend is ready."
    })


# =========================================================
# CROP IMAGE UPLOAD + AI PREDICTION
# =========================================================

@app.route("/api/predict", methods=["POST"])
def predict():

    # Check image
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image uploaded."
        }), 400

    file = request.files["image"]

    # Check filename
    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "No image selected."
        }), 400

    # Check file type
    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": "Only JPG, JPEG, PNG and WEBP images are allowed."
        }), 400

    # Secure original filename
    original_name = secure_filename(file.filename)

    # Get extension
    extension = original_name.rsplit(".", 1)[1].lower()

    # Create unique filename
    unique_name = (
        datetime.now().strftime("%Y%m%d_%H%M%S")
        + "_"
        + uuid.uuid4().hex[:8]
        + "."
        + extension
    )

    # Save image
    save_path = UPLOAD_DIR / unique_name
    file.save(save_path)

    # Get prediction
    prediction = create_prediction(original_name)

    return jsonify({
        "success": True,
        "project": "Green Fingers",
        "filename": original_name,
        "saved_file": unique_name,
        "image_url": f"/uploads/{unique_name}",
        "prediction": prediction,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })


# =========================================================
# UPLOADED IMAGE ACCESS
# =========================================================

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# =========================================================
# FARMER FAQs
# =========================================================

FAQS = [

    {
        "question": "Which crop and variety are you growing?",
        "answer": "Please tell us the crop name and variety if known. Example: Tomato - Pusa Ruby."
    },

    {
        "question": "What symptoms are you seeing on the plant?",
        "answer": "Describe visible symptoms such as yellowing, brown spots, wilting, holes, curling leaves, white powder or unusual growth."
    },

    {
        "question": "When did you first notice the symptoms?",
        "answer": "Tell us approximately how many days ago the symptoms were first noticed. This helps understand how the problem is progressing."
    },

    {
        "question": "How much of your field is affected?",
        "answer": "Mention the approximate affected area, such as one plant, a few plants, one section, half the field or most of the field."
    },

    {
        "question": "What has the weather been like recently?",
        "answer": "Tell us about recent rain, humidity, temperature, heat, cold, strong winds or unusual weather changes."
    },

    {
        "question": "Have you already used any pesticide, fertilizer or treatment?",
        "answer": "Tell us what product or treatment was used and when it was applied. Always follow the product label and local agricultural guidance."
    }

]


@app.route("/api/faqs")
def get_faqs():

    return jsonify({
        "success": True,
        "project": "Green Fingers",
        "faqs": FAQS
    })


# =========================================================
# WEATHER RISK
# =========================================================

@app.route("/api/weather-risk", methods=["POST"])
def weather_risk():

    data = request.get_json(silent=True) or {}

    try:
        temperature = float(data.get("temperature", 28))
        humidity = float(data.get("humidity", 70))

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "error": "Temperature and humidity must be numbers."
        }), 400

    # High risk
    if humidity >= 80 and temperature >= 24:

        risk = "High"

        message = (
            "High outbreak risk. High humidity and warm conditions "
            "can support disease development. Monitor crops regularly."
        )

    # Medium risk
    elif humidity >= 65 and temperature >= 20:

        risk = "Medium"

        message = (
            "Moderate risk. Continue monitoring leaves and maintain "
            "good field ventilation."
        )

    # Low risk
    else:

        risk = "Low"

        message = (
            "Lower disease-favouring weather risk at the provided "
            "temperature and humidity."
        )

    return jsonify({
        "success": True,
        "temperature": temperature,
        "humidity": humidity,
        "risk": risk,
        "message": message
    })


# =========================================================
# ERROR - FILE TOO LARGE
# =========================================================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "File is too large. Maximum allowed size is 5 MB."
    }), 413


# =========================================================
# ERROR - PAGE NOT FOUND
# =========================================================

@app.errorhandler(404)
def page_not_found(error):

    return jsonify({
        "success": False,
        "error": "Requested page or API endpoint was not found."
    }), 404


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    print("")
    print("=" * 55)
    print("        GREEN FINGERS - AI AGRICULTURE")
    print("=" * 55)
    print("Backend: RUNNING")
    print("Frontend: http://127.0.0.1:5000")
    print("API Health: http://127.0.0.1:5000/api/health")
    print("=" * 55)
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )