document.getElementById('file').addEventListener('change', handleFile);
document.getElementById('previewBtn').addEventListener('click', previewFile);
document.getElementById('convertBtn').addEventListener('click', convertToPDF);

let parsedData = []; // Store parsed data globally

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        if (file.name.endsWith(".csv")) {
            parsedData = removeBlankRows(processCSV(e.target.result));
        } else {
            processExcel(e.target.result).then(data => {
                parsedData = removeBlankRows(data);
            });
        }
    };

    reader.onerror = function () {
        alert("Error reading file. Please try again.");
    };

    if (file.name.endsWith(".csv")) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// **Proper CSV Parsing**
function processCSV(csvData) {
    return Papa.parse(csvData, { header: false }).data;
}

// **Excel Processing**
async function processExcel(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

// **Remove Blank Rows from Parsed Data**
function removeBlankRows(data) {
    return data.filter(row => row.some(cell => cell && cell.toString().trim() !== ""));
}

// **Display Data Preview with Images**
function previewFile() {
    if (parsedData.length === 0) {
        alert("Please upload a file first.");
        return;
    }

    const previewContainer = document.getElementById("previewContainer");
    previewContainer.innerHTML = "";

    const table = document.createElement("table");
    table.border = "1";

    parsedData.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const td = document.createElement("td");
            if (isValidURL(cell)) {
                const img = document.createElement("img");
                img.src = cell;
                img.width = 50;
                img.onerror = () => { td.textContent = "[Image Not Found]"; };
                td.appendChild(img);
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    previewContainer.appendChild(table);
}

// **Convert Data to PDF (Each Row on a New Page)**
async function convertToPDF() {
    if (parsedData.length === 0) {
        alert("Please preview the data first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const imgWidth = parseInt(document.getElementById("imgWidth").value) || 50;

    for (let i = 0; i < parsedData.length; i++) {
        let row = parsedData[i];

        let text = "";
        let imgPromises = [];

        for (const cell of row) {
            if (isValidURL(cell)) {
                imgPromises.push(getImageBase64(cell));
            } else {
                text += cell + " ";
            }
        }

        const base64Images = await Promise.all(imgPromises);

        doc.setFontSize(12);
        doc.text(text, 10, 20);

        let yPos = 30;
        for (const imgObj of base64Images) {
            if (imgObj) {
                let imgHeight = imgWidth / imgObj.scaleFactor; // Auto adjust height
                doc.addImage(imgObj.base64, "JPEG", 10, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10; // Adjusting spacing
            }
        }

        if (i < parsedData.length - 1) {
            doc.addPage(); // Move to next page for the next row
        }
    }

    doc.save("converted.pdf");
}

//Convert Image URL to Base64 (Handles CORS Issues)
function getImageBase64(url) {
    return new Promise((resolve) => {
        let img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            let canvas = document.createElement("canvas");
            let scaleFactor = img.width / img.height; // Aspect Ratio
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve({ base64: canvas.toDataURL("image/jpeg"), scaleFactor });
        };
        img.onerror = function () {
            resolve(null); // Handle broken images
        };
        img.src = url + "?not-from-cache=" + new Date().getTime(); // Force fresh image loading
    });
}

//Check if a String is a Valid URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}


document.addEventListener("DOMContentLoaded", function() {
            const fileInput = document.getElementById('file');

            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (!file) return;

                // Display file name
                document.getElementById('fileNameDisplay').textContent = file.name;

                // Show file type icon
                showFileTypeIcon(file);
            });

            function showFileTypeIcon(file) {
                const fileTypeContainer = document.getElementById("fileTypeContainer");
                fileTypeContainer.innerHTML = ""; // Clear previous icon

                const fileName = file.name.toLowerCase();
                const icon = document.createElement("img");

                if (fileName.endsWith(".csv")) {
                    icon.src = "https://img.icons8.com/?size=100&id=GN2oztq0L0Fd&format=png&color=000000"; // CSV icon
                    icon.alt = "CSV File";
                } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
                    icon.src = "https://img.icons8.com/?size=100&id=cerKWiqkPXbg&format=png&color=000000"; // Excel icon
                    icon.alt = "Excel File";
                } else {
                    alert("Unsupported file type. Please upload a CSV or Excel file.");
                    return;
                }

                icon.style.width = "20px"; 

                fileTypeContainer.appendChild(icon);
            }
        });
