const keysToNodeTypes = {
    "KeyC": "checkbox",
    "KeyT": "text",
    "KeyD": "done",
    "KeyF": "failed",
    "KeyW": "waiting",
    "KeyQ": "idea",
    "KeyX": "cancelled"
};

const nodeTypesToEmojis = {
    "checkbox": "👉",
    "text": "ℹ️",
    "done": "✅",
    "failed": "❌",
    "waiting": "⏳",
    "idea": "🦄",
    "cancelled": "💤"
};


let cursorPosition = 0;
let editMode = 0;
var pressedKeys = {};

window.addEventListener("load", function() {
    readCursorPositionFromHash();
    updateVisibleList();

    document.addEventListener("keydown", function(event) {
        pressedKeys[event.code] = true;

        if ((pressedKeys.MetaLeft || pressedKeys.MetaRight) && (pressedKeys.AltLeft || pressedKeys.AltRight)) {
            if (event.code === "ArrowDown") {
                swapDown();
                event.preventDefault();
            } else if (event.code === "ArrowUp") {
                swapUp();
                event.preventDefault();
            } else if (event.code === "ArrowRight") {
                increaseIndentUnderCursor();
                event.preventDefault();
            } else if (event.code === "ArrowLeft") {
                decreaseIndentUnderCursor();
                event.preventDefault();
            }
        }

        if (editMode === 1) {
            if (event.code === "Enter") {
                endEditMode();
            }
        } else {
            if (event.code === "Enter") {
                startEditMode();
            } else if (event.code in keysToNodeTypes) {
                setTypeUnderCursor(keysToNodeTypes[event.code]);
                updateVisibleList();
            } else if (event.code === "Backspace") {
                removeElementUnderCursor();
            } else if (event.code === "ArrowDown") {
                cursorDown();
                event.preventDefault();
            } else if (event.code === "ArrowUp") {
                cursorUp();
                event.preventDefault();
            }

        }
        console.log(event.code);
    });

    document.addEventListener("keyup", function(event) {
        pressedKeys[event.code] = false;
    });
});

function startEditMode() {
    editMode = 1;
    document.getElementById("status").innerText = "editing";

    const element = getCursorElement();
    const text = getTextUnderCursor();

    const span = element.getElementsByTagName("span")[0];
    element.removeChild(span);

    var inputElement = document.createElement("input");
    inputElement.classList.add("input-text");
    inputElement.setAttribute("type", "text");
    inputElement.value = text;
    element.appendChild(inputElement);
    inputElement.focus();
}

function getCursorElement() {
    return document.getElementsByClassName("cursor-node")[0];
}

function endEditMode() {
    editMode = 0;
    document.getElementById("status").innerText = "viewing";
    const inputElement = document.getElementsByClassName("input-text")[0];
    const newText = inputElement.value;
    setTextUnderCursor(newText);
    updateVisibleList();
}



function readCursorPositionFromHash() {
    const position = parseInt(document.location.hash.substr(1));
    if (!isNaN(position)) {
        cursorPosition = position;
    } else {
        cursorPosition = 0;
    }
    clampAndSaveCursorPosition();
    updateVisibleList();
}

window.addEventListener("hashchange", readCursorPositionFromHash, false);

function cursorDown() {
    cursorPosition += 1;
    clampAndSaveCursorPosition();
    updateVisibleList();
}

function cursorUp() {
    cursorPosition -= 1;
    clampAndSaveCursorPosition();
    updateVisibleList();
}

function clampAndSaveCursorPosition() {
    cursorPosition = Math.min(getSavedElements().length - 1, cursorPosition);
    cursorPosition = Math.max(0, cursorPosition);
    document.location.hash = cursorPosition;
    console.log(document.location.hash);
}



function addNode(type) {
    if (type in nodeTypesToEmojis) {
        addEmptyElementAfterIndex(type, cursorPosition);
    }
    console.warn("Unrecognized node type: " + type);
}

function updateVisibleList() {
    var elementsWrapper = document.getElementById("code");
    const elements = getSavedElements();

    elementsWrapper.innerHTML = "";

    elements.forEach(function(element, index) {
        var newDiv = document.createElement("div");
        let padding = "— ".repeat(element.indentation);
        var newContent = document.createTextNode(padding + nodeTypesToEmojis[element.type] + " ");
        if (index === cursorPosition) {
            newDiv.classList.add("cursor-node");
        }
        newDiv.appendChild(newContent);

        var textElement = document.createElement("span");
        textElement.innerText = element.text;
        newDiv.appendChild(textElement);

        elementsWrapper.appendChild(newDiv);
    });
}

function getSavedElements() {
    let data = loadData();
    if (data === null) {
        data = [];
    }
    return data;
}

function setTypeUnderCursor(type) {
    let previous = getSavedElements();
    previous[cursorPosition].type = type;
    saveData(previous);
    updateVisibleList();
}

function addEmptyElementAfterIndex(type, index) {
    let element = {"type": type, "text": "", "indentation": 0};
    let previous = getSavedElements();
    previous.splice(index+1, 0, element);
    saveData(previous);
    cursorDown();
    updateVisibleList();
}

function removeElementUnderCursor() {
    let previous = getSavedElements();
    previous.splice(cursorPosition, 1);
    saveData(previous);
    cursorUp();
    updateVisibleList();
}

function swapDown() {
    swap(cursorPosition, cursorPosition + 1);
}

function swapUp() {
    swap(cursorPosition - 1, cursorPosition);
}

function swap(a, b) {
    let previous = getSavedElements();
    if (a < 0 || a >= previous.length || b < 0 || b >= previous.length) {
        return;
    }
    let temp = previous[a];
    previous[a] = previous[b];
    previous[b] = temp;
    saveData(previous);
}

function setTextUnderCursor(text) {
    let previous = getSavedElements();
    previous[cursorPosition].text = text;
    saveData(previous);
    updateVisibleList();
}

function getTextUnderCursor() {
    let previous = getSavedElements();
    return previous[cursorPosition].text;
}

function increaseIndentUnderCursor(text) {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;
    previous[cursorPosition].indentation = curr + 1;
    saveData(previous);
    updateVisibleList();
}

function decreaseIndentUnderCursor(text) {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;
    previous[cursorPosition].indentation = Math.max(0, curr - 1);
    saveData(previous);
    updateVisibleList();
}



const localStorageKey = "todoapp-data";

function saveData(blob) {
    const asText = JSON.stringify(blob)
    localStorage.setItem(localStorageKey, asText);
}

function loadData() {
    const asText = localStorage.getItem(localStorageKey);
    return JSON.parse(asText);
}
