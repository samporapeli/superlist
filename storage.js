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
    document.location.hash = cursorPosition;
    console.log(document.location.hash);
}

function readCursorPositionFromHash() {
    const position = parseInt(document.location.hash.substr(1));
    if (!isNaN(position)) {
        cursorTo(position);
    } else {
        cursorTo(0);
    }
}

window.addEventListener("hashchange", readCursorPositionFromHash, false);



// Element storage

function getSavedElements() {
    let data = loadData();
    if (data === null) {
        data = [];
    }
    return data;
}

function saveData(blob) {
    const asText = JSON.stringify(blob)
    saveEncodedData(asText);
    exportDataToTextBox(asText);
}

function loadData() {
    const asText = loadEncodedData();
    return JSON.parse(asText);
}

const localStorageKey = "todoapp-data";

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
