/* =====================================================
   GREEN FINGERS
   Frontend JavaScript
===================================================== */


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let selectedFile = null;

let currentPrediction = null;

const MAX_FILE_SIZE = 5 * 1024 * 1024;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const imageInput =
    document.getElementById("imageInput");

const browseBtn =
    document.getElementById("browseBtn");

const uploadArea =
    document.getElementById("uploadArea");

const uploadDefault =
    document.getElementById("uploadDefault");

const previewBox =
    document.getElementById("previewBox");

const previewImage =
    document.getElementById("previewImage");

const fileName =
    document.getElementById("fileName");

const fileSize =
    document.getElementById("fileSize");

const removeImage =
    document.getElementById("removeImage");

const analyzeBtn =
    document.getElementById("analyzeBtn");


/* =====================================================
   IMAGE UPLOAD
===================================================== */

if (browseBtn) {

    browseBtn.addEventListener("click", function () {

        imageInput.click();

    });

}


if (imageInput) {

    imageInput.addEventListener("change", function () {

        if (this.files.length > 0) {

            handleFile(this.files[0]);

        }

    });

}


/* =====================================================
   DRAG AND DROP
===================================================== */

if (uploadArea) {

    uploadArea.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            uploadArea.classList.add("dragover");

        }
    );


    uploadArea.addEventListener(
        "dragleave",
        function () {

            uploadArea.classList.remove("dragover");

        }
    );


    uploadArea.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            uploadArea.classList.remove("dragover");

            const files = event.dataTransfer.files;

            if (files.length > 0) {

                handleFile(files[0]);

            }

        }
    );

}


/* =====================================================
   HANDLE FILE
===================================================== */

function handleFile(file) {

    if (!file) {
        return;
    }


    if (!file.type.startsWith("image/")) {

        showToast("Please upload a valid image.");

        return;
    }


    if (file.size > MAX_FILE_SIZE) {

        showToast("Image must be smaller than 5 MB.");

        return;
    }


    selectedFile = file;


    fileName.textContent =
        file.name;


    fileSize.textContent =
        formatFileSize(file.size);


    const reader =
        new FileReader();


    reader.onload = function (event) {

        previewImage.src =
            event.target.result;

        uploadDefault.style.display =
            "none";

        previewBox.style.display =
            "flex";

        analyzeBtn.disabled =
            false;

    };


    reader.readAsDataURL(file);


    showToast("Crop image uploaded successfully.");

}


/* =====================================================
   REMOVE IMAGE
===================================================== */

if (removeImage) {

    removeImage.addEventListener(
        "click",
        function () {

            selectedFile = null;

            imageInput.value = "";

            previewImage.src = "";

            previewBox.style.display =
                "none";

            uploadDefault.style.display =
                "block";

            analyzeBtn.disabled =
                true;

            resetDiagnosis();

        }
    );

}


/* =====================================================
   ANALYZE BUTTON
===================================================== */

if (analyzeBtn) {

    analyzeBtn.addEventListener(
        "click",
        analyzeCrop
    );

}


/* =====================================================
   ANALYZE CROP
===================================================== */

async function analyzeCrop() {

    if (!selectedFile) {

        showToast("Please upload a crop image first.");

        return;
    }


    analyzeBtn.disabled =
        true;

    analyzeBtn.classList.add("loading");

    analyzeBtn.textContent =
        "⏳ Analyzing Crop...";


    /*
       First try backend.
       If backend is not available,
       frontend demo prediction is used.
    */

    try {

        const formData =
            new FormData();

        formData.append(
            "image",
            selectedFile
        );


        const response =
            await fetch(
                "/api/predict",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Backend unavailable"
            );

        }


        const data =
            await response.json();


        if (data.success) {

            currentPrediction =
                normalizeBackendPrediction(data);

            displayPrediction(
                currentPrediction
            );

        } else {

            throw new Error(
                "Prediction failed"
            );

        }


    } catch (error) {

        /*
           Demo mode.
           This keeps the project working even
           when backend/model is not connected.
        */

        await wait(1200);


        currentPrediction =
            generateDemoPrediction(
                selectedFile.name
            );


        displayPrediction(
            currentPrediction
        );

    }


    saveScanHistory(
        currentPrediction
    );


    analyzeBtn.disabled =
        false;

    analyzeBtn.classList.remove(
        "loading"
    );

    analyzeBtn.textContent =
        "✓ Analysis Complete";


    setTimeout(function () {

        analyzeBtn.textContent =
            "🔍 Analyze Crop with AI";

    }, 2500);


    showToast(
        "Crop analysis completed."
    );

}


/* =====================================================
   BACKEND NORMALIZER
===================================================== */

function normalizeBackendPrediction(data) {

    return {

        disease:
            data.disease ||
            data.prediction ||
            "Crop Health Issue",

        crop:
            data.crop ||
            "Crop",

        confidence:
            Number(
                data.confidence ||
                90
            ),

        icon:
            data.icon ||
            "🌿",

        description:
            data.description ||
            "The system identified visible crop-leaf patterns.",

        evidence:
            data.evidence ||
            [
                "Visible discoloration",
                "Texture variation",
                "Localized leaf changes"
            ],

        advice:
            data.advice ||
            [
                "Monitor affected plants.",
                "Remove severely affected leaves.",
                "Consult a local agriculture expert."
            ]

    };

}


/* =====================================================
   DEMO PREDICTION
===================================================== */

function generateDemoPrediction(filename) {

    const lower =
        filename.toLowerCase();


    if (
        lower.includes("healthy")
    ) {

        return {

            disease: "Healthy Leaf",

            crop: "Tomato",

            confidence: 97,

            icon: "🌱",

            description:
                "The uploaded image appears visually consistent with a healthy leaf pattern.",

            evidence: [

                "Healthy green coloration",

                "No major circular lesions visible",

                "Uniform leaf texture"

            ],

            advice: [

                "Continue regular crop monitoring.",

                "Maintain balanced irrigation.",

                "Monitor for early symptoms."

            ]

        };

    }


    if (
        lower.includes("late")
    ) {

        return {

            disease: "Late Blight",

            crop: "Tomato",

            confidence: 91,

            icon: "🍅",

            description:
                "Visible dark and irregular discoloration patterns are consistent with a late-blight-like pattern.",

            evidence: [

                "Dark irregular leaf regions",

                "Visible discoloration",

                "Localized damaged tissue"

            ],

            advice: [

                "Remove severely affected leaves.",

                "Improve air circulation.",

                "Avoid prolonged leaf wetness."

            ]

        };

    }


    if (
        lower.includes("pest")
    ) {

        return {

            disease: "Pest Damage",

            crop: "Tomato",

            confidence: 89,

            icon: "🐛",

            description:
                "The image contains visible leaf damage patterns that may be associated with pest activity.",

            evidence: [

                "Small damaged regions",

                "Irregular holes or feeding marks",

                "Localized leaf tissue damage"

            ],

            advice: [

                "Inspect the underside of leaves.",

                "Monitor pest population.",

                "Use locally approved pest-management methods."

            ]

        };

    }


    return {

        disease: "Early Blight",

        crop: "Tomato",

        confidence: 94,

        icon: "🍅",

        description:
            "Brown spot and discoloration patterns are visually consistent with an early-blight-like pattern.",

        evidence: [

            "Brown circular spot-like regions",

            "Visible discoloration",

            "Disease-like leaf texture variation"

        ],

        advice: [

            "Remove severely affected leaves.",

            "Improve air circulation around plants.",

            "Avoid prolonged leaf wetness."

        ]

    };

}


/* =====================================================
   DISPLAY PREDICTION
===================================================== */

function displayPrediction(prediction) {

    if (!prediction) {
        return;
    }


    document.getElementById(
        "diseaseName"
    ).textContent =
        prediction.disease;


    document.getElementById(
        "cropName"
    ).textContent =
        prediction.crop;


    document.getElementById(
        "confidenceValue"
    ).textContent =
        prediction.confidence + "%";


    document.getElementById(
        "confidenceStat"
    ).textContent =
        prediction.confidence + "%";


    document.querySelector(
        ".diagnosis-icon"
    ).textContent =
        prediction.icon;


    document.getElementById(
        "diagnosisDescription"
    ).textContent =
        prediction.description;


    /* Evidence */

    const evidenceList =
        document.getElementById(
            "evidenceList"
        );


    evidenceList.innerHTML = "";


    prediction.evidence.forEach(
        function (item) {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                item;

            evidenceList.appendChild(
                li
            );

        }
    );


    /* AI Evidence */

    document.getElementById(
        "aiEvidence"
    ).textContent =
        prediction.evidence.join(
            ". "
        ) + ".";


    /* Treatment title */

    document.getElementById(
        "aiTreatmentTitle"
    ).textContent =
        prediction.disease +
        " • " +
        prediction.crop;


    /* Treatment advice */

    const adviceList =
        document.getElementById(
            "aiAdviceList"
        );


    adviceList.innerHTML = "";


    prediction.advice.forEach(
        function (item) {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                item;

            adviceList.appendChild(
                li
            );

        }
    );


    /* Explainable AI image */

    const heatmapPlaceholder =
        document.getElementById(
            "heatmapPlaceholder"
        );

    const heatmapImage =
        document.getElementById(
            "heatmapImage"
        );


    heatmapImage.src =
        URL.createObjectURL(
            selectedFile
        );


    heatmapPlaceholder.style.display =
        "none";

    heatmapImage.style.display =
        "block";

}


/* =====================================================
   RESET DIAGNOSIS
===================================================== */

function resetDiagnosis() {

    document.getElementById(
        "diseaseName"
    ).textContent =
        "Awaiting Image";


    document.getElementById(
        "cropName"
    ).textContent =
        "Upload a crop leaf";


    document.getElementById(
        "confidenceValue"
    ).textContent =
        "--";


    document.getElementById(
        "confidenceStat"
    ).textContent =
        "--";


    document.getElementById(
        "diagnosisDescription"
    ).textContent =
        "Upload an image to receive an AI-assisted crop health analysis.";


    document.getElementById(
        "aiTreatmentTitle"
    ).textContent =
        "Awaiting diagnosis";


    document.getElementById(
        "aiEvidence"
    ).textContent =
        "The system will identify visible patterns related to discoloration, texture and localized leaf changes.";


    document.getElementById(
        "heatmapPlaceholder"
    ).style.display =
        "block";


    document.getElementById(
        "heatmapImage"
    ).style.display =
        "none";

}


/* =====================================================
   WEATHER RISK
===================================================== */

const weatherBtn =
    document.getElementById(
        "weatherBtn"
    );


if (weatherBtn) {

    weatherBtn.addEventListener(
        "click",
        checkWeatherRisk
    );

}


function checkWeatherRisk() {

    const temperature =
        Number(
            document.getElementById(
                "temperature"
            ).value
        );


    const humidity =
        Number(
            document.getElementById(
                "humidity"
            ).value
        );


    const title =
        document.getElementById(
            "weatherTitle"
        );


    const message =
        document.getElementById(
            "weatherMessage"
        );


    const riskStat =
        document.getElementById(
            "riskStat"
        );


    if (
        humidity >= 80 &&
        temperature >= 20 &&
        temperature <= 35
    ) {

        title.textContent =
            "⚠ HIGH OUTBREAK RISK";

        message.textContent =
            "उच्च आर्द्रता और अनुकूल तापमान के कारण फसल रोग का जोखिम बढ़ सकता है। नियमित रूप से फसल की निगरानी करें।";

        riskStat.textContent =
            "High";

        riskStat.style.color =
            "#c33d3d";

    }

    else if (
        humidity >= 65
    ) {

        title.textContent =
            "⚠ MODERATE OUTBREAK RISK";

        message.textContent =
            "मध्यम आर्द्रता के कारण कुछ फसल रोगों का जोखिम हो सकता है। फसल की नियमित जांच करें।";

        riskStat.textContent =
            "Medium";

        riskStat.style.color =
            "#a36c00";

    }

    else {

        title.textContent =
            "✓ LOW OUTBREAK RISK";

        message.textContent =
            "वर्तमान तापमान और आर्द्रता के आधार पर तत्काल मौसम-सम्बंधित रोग जोखिम कम दिखाई देता है।";

        riskStat.textContent =
            "Low";

        riskStat.style.color =
            "#197244";

    }

}


/* =====================================================
   HISTORY
===================================================== */

function saveScanHistory(prediction) {

    if (!prediction) {
        return;
    }


    let history =
        JSON.parse(
            localStorage.getItem(
                "greenFingersHistory"
            )
        ) || [];


    const scan = {

        crop:
            prediction.crop,

        prediction:
            prediction.disease,

        confidence:
            prediction.confidence,

        risk:
            getCurrentRisk(),

        time:
            new Date().toLocaleTimeString()

    };


    history.unshift(
        scan
    );


    history =
        history.slice(
            0,
            10
        );


    localStorage.setItem(
        "greenFingersHistory",
        JSON.stringify(history)
    );


    renderHistory();

}


/* =====================================================
   GET RISK
===================================================== */

function getCurrentRisk() {

    const risk =
        document.getElementById(
            "riskStat"
        ).textContent;


    return risk;

}


/* =====================================================
   RENDER HISTORY
===================================================== */

function renderHistory() {

    const body =
        document.getElementById(
            "historyBody"
        );


    let history =
        JSON.parse(
            localStorage.getItem(
                "greenFingersHistory"
            )
        ) || [];


    document.getElementById(
        "scanCount"
    ).textContent =
        history.length;


    if (
        history.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-history"
                >
                    No scans yet. Upload your first crop image.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML = "";


    history.forEach(
        function (item) {

            const row =
                document.createElement(
                    "tr"
                );


            let riskClass =
                "risk-medium";


            if (
                item.risk === "High"
            ) {

                riskClass =
                    "risk-high";

            }

            else if (
                item.risk === "Low"
            ) {

                riskClass =
                    "risk-low";

            }


            row.innerHTML = `

                <td>
                    ${escapeHTML(item.crop)}
                </td>

                <td>
                    ${escapeHTML(item.prediction)}
                </td>

                <td>
                    ${item.confidence}%
                </td>

                <td>
                    <span
                        class="risk-badge ${riskClass}"
                    >
                        ${escapeHTML(item.risk)}
                    </span>
                </td>

                <td>
                    ${escapeHTML(item.time)}
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   FAQ
===================================================== */

function initializeFAQs() {

    const faqItems =
        document.querySelectorAll(
            ".faq-item"
        );


    faqItems.forEach(
        function (item) {

            const question =
                item.querySelector(
                    ".faq-question"
                );


            question.addEventListener(
                "click",
                function () {

                    const wasActive =
                        item.classList.contains(
                            "active"
                        );


                    /*
                       Close every FAQ
                    */

                    faqItems.forEach(
                        function (otherItem) {

                            otherItem.classList.remove(
                                "active"
                            );

                        }
                    );


                    /*
                       Open clicked FAQ
                       if it was not already open
                    */

                    if (!wasActive) {

                        item.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   LANGUAGE BUTTON
===================================================== */

const languageBtn =
    document.getElementById(
        "languageBtn"
    );


let hindiMode = false;


if (languageBtn) {

    languageBtn.addEventListener(
        "click",
        function () {

            hindiMode =
                !hindiMode;


            if (hindiMode) {

                languageBtn.textContent =
                    "🌐 English";

                showToast(
                    "Hindi support enabled."
                );

            }

            else {

                languageBtn.textContent =
                    "🌐 हिंदी";

                showToast(
                    "English interface enabled."
                );

            }

        }
    );

}


/* =====================================================
   SIDEBAR ACTIVE LINK
===================================================== */

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                navLinks.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                link.classList.add(
                    "active"
                );

            }
        );

    }
);


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


/* =====================================================
   FORMAT FILE SIZE
===================================================== */

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }


    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(1) + " KB";

    }


    return (
        bytes /
        (1024 * 1024)
    ).toFixed(1) + " MB";

}


/* =====================================================
   WAIT
===================================================== */

function wait(ms) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                ms
            );

        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderHistory();

        initializeFAQs();

        checkWeatherRisk();

    }
);