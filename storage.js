// Cursor

let cursorPosition = 0;

function cursorDown() {
    cursorTo(cursorPosition + 1);
}

function cursorUp() {
    cursorTo(cursorPosition - 1);
}

function cursorTo(index) {
    cursorPosition = index;
    clampAndSaveCursorPosition();
}

function clampAndSaveCursorPosition() {
    cursorPosition = Math.min(getSavedElements().length - 1, cursorPosition);
    cursorPosition = Math.max(0, cursorPosition);
    let elements = getSavedElements();
    if (elements.length === 0) {
        return;
    }
    document.location.hash = elements[cursorPosition].id;
    console.log(document.location.hash);
}

function updateCursorPositionFromHash() {
    let position = 0;

    const id = document.location.hash.substr(1);
    let elements = getSavedElements();
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].id === id) {
            position = i;
            break;
        }
    }

    cursorTo(position);
    updateVisibleList();
}

window.addEventListener("hashchange", updateCursorPositionFromHash, false);



// Element storage

function getSavedElements() {
    let data = loadData();
    if (data === null) {
        data = [];
    }
    return data;
}

function saveData(blob) {
    for (let i = 0; i < blob.length; i++) {
        if (blob[i].id === undefined) {
            blob[i].id = generateUID();
        }
    }

    const asText = JSON.stringify(blob)
    saveEncodedData(asText);
    exportDataToTextBox(asText);
}

function generateUID() {
    // ~155 bits of entropy
    let id = "";
    id += Math.random().toString(36).substring(2, 15);
    id += Math.random().toString(36).substring(2, 15);
    id += Math.random().toString(36).substring(2, 15);
    return id.substring(0, 30);
}

function loadData() {
    const asText = loadEncodedData();
    return JSON.parse(asText);
}

const localStorageKey = "superlist-data";

function saveEncodedData(text) {
    localStorage.setItem(localStorageKey, text);
}

function loadEncodedData() {
    return localStorage.getItem(localStorageKey);
}

function importDataFromTextBox() {
    const exportBox = document.getElementById("export-data");
    let text = exportBox.value;
    if (text.length === 0) {
        alert("Can't load empty data")
    }
    saveEncodedData(text);
    console.log("textbox content", text);
}

function exportDataToTextBox(text) {
    const exportBox = document.getElementById("export-data");
    exportBox.value = text;
}
