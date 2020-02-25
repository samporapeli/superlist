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


let editMode = 0;



// Keyboard mapping

var pressedKeys = {};

window.addEventListener("load", function() {
    readCursorPositionFromHash();
    updateVisibleList();

    document.addEventListener("keydown", function(event) {
        pressedKeys[event.code] = true;

        if (editMode === 1) {
            if (event.code === "Enter") {
                endEditMode();
            }

        } else if ((pressedKeys.MetaLeft || pressedKeys.MetaRight) && (pressedKeys.AltLeft || pressedKeys.AltRight)) {
            if (event.code === "ArrowDown") {
                swapDown();
                updateVisibleList();
                event.preventDefault();

            } else if (event.code === "ArrowUp") {
                swapUp();
                updateVisibleList();
                event.preventDefault();

            } else if (event.code === "ArrowRight") {
                increaseIndentUnderCursor();
                updateVisibleList();
                event.preventDefault();

            } else if (event.code === "ArrowLeft") {
                decreaseIndentUnderCursor();
                updateVisibleList();
                event.preventDefault();
            }

        } else {

            let pressedTypeKeys = Object.keys(pressedKeys)
            .filter(key => pressedKeys[key] === true)
            .filter(key => key in keysToNodeTypes);

            if (pressedTypeKeys.length == 1) {
                const type = keysToNodeTypes[pressedTypeKeys[0]];

                if (event.code === "ArrowDown") {
                    addNodeDown(type);
                    updateVisibleList();
                    startEditMode();
                    event.preventDefault();

                } else if (event.code === "ArrowUp") {
                    addNodeUp(type);
                    updateVisibleList();
                    startEditMode();
                    event.preventDefault();

                } else if (event.code === "ArrowRight") {
                    addNodeRight(type);
                    updateVisibleList();
                    startEditMode();
                    event.preventDefault();

                } else if (event.code === "ArrowLeft") {
                    addNodeLeft(type);
                    updateVisibleList();
                    startEditMode();
                    event.preventDefault();
                }
            }

            if (pressedTypeKeys.length == 0) {

                if (event.code === "Enter") {
                    startEditMode();

                } else if (event.code === "Backspace") {
                    removeElementUnderCursor();
                    updateVisibleList();

                } else if (event.code === "ArrowDown") {
                    cursorToNextSibling();
                    updateVisibleList();
                    event.preventDefault();

                } else if (event.code === "ArrowUp") {
                    cursorToPreviousSibling();
                    updateVisibleList();
                    event.preventDefault();

                } else if (event.code === "ArrowRight") {
                    cursorToFirstChild();
                    updateVisibleList();
                    event.preventDefault();

                } else if (event.code === "ArrowLeft") {
                    cursorToParent();
                    updateVisibleList();
                    event.preventDefault();
                }
            }
        }
        console.log(event.code);
    });

    document.addEventListener("keyup", function(event) {
        pressedKeys[event.code] = false;

        if (editMode === 0) {
            if (event.code in keysToNodeTypes) {
                setTypeUnderCursor(keysToNodeTypes[event.code]);
                updateVisibleList();
            }
        }
    });
});



// Rendering

function startEditMode() {
    editMode = 1;
    document.getElementById("status").innerText = "editing";

    const element = getCursorElement();
    console.log(element);
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

function getTextUnderCursor() {
    let previous = getSavedElements();
    return previous[cursorPosition].text;
}

function endEditMode() {
    editMode = 0;
    document.getElementById("status").innerText = "viewing";
    const inputElement = document.getElementsByClassName("input-text")[0];
    const newText = inputElement.value;
    setTextUnderCursor(newText);
    updateVisibleList();
}

function updateVisibleList() {
    var elementsWrapper = document.getElementById("code");
    const elements = getSavedElements();

    elementsWrapper.innerHTML = "";

    let smallestIndentation = Math.max(0, getIndentationAtCursor() - 1);
    let minIndex = getIndexOfParent() || 0;
    let maxIndex = getIndexOfLastAncestorOfParent();

    let lastIndentation = 0;
    elements.forEach(function(element, index) {

        if (index >= minIndex && index <= maxIndex) {
            // && element.indentation <= smallestIndentation + 1) {
            let padding = "— ".repeat(element.indentation);// - smallestIndentation);

            if (element.indentation <= smallestIndentation + 1) {
                var newDiv = document.createElement("div");
                var newContent = document.createTextNode(padding + nodeTypesToEmojis[element.type] + " ");
                if (index === cursorPosition) {
                    newDiv.classList.add("cursor-node");
                }
                newDiv.appendChild(newContent);

                var textElement = document.createElement("span");
                textElement.innerText = element.text;
                newDiv.appendChild(textElement);

                elementsWrapper.appendChild(newDiv);

            } else if (element.indentation == smallestIndentation + 2) {
                let emoji = nodeTypesToEmojis[element.type];
                if (element.indentation > lastIndentation) {
                    var paddingSpan = document.createElement("span");
                    var paddingText = document.createTextNode(padding);
                    paddingSpan.appendChild(paddingText);
                    elementsWrapper.appendChild(paddingSpan);

                    var newSpan = document.createElement("span");
                    newSpan.classList.add("children-list");
                    var newContent = document.createTextNode(emoji);
                    newSpan.appendChild(newContent);
                    elementsWrapper.appendChild(newSpan);
                } else {
                    let spans = elementsWrapper.getElementsByTagName("span");
                    let span = spans[spans.length - 1];
                    span.innerText += " " + emoji;
                }
            }
        }
        lastIndentation = element.indentation;
    });
}



// Actions

function setTextUnderCursor(text) {
    let previous = getSavedElements();
    previous[cursorPosition].text = text;
    saveData(previous);
}

function setTypeUnderCursor(type) {
    let previous = getSavedElements();
    previous[cursorPosition].type = type;
    saveData(previous);
}

function removeElementUnderCursor() {
    let previous = getSavedElements();
    previous.splice(cursorPosition, 1);
    saveData(previous);
    cursorUp();
}

// Navigation with indentations

function cursorToNextSibling() {
    let index = getIndexOfNextSibling();
    if (index !== undefined) {
        cursorPosition = index;
        clampAndSaveCursorPosition();
    }
}

function cursorToPreviousSibling() {
    let index = getIndexOfPreviousSibling();
    if (index !== undefined) {
        cursorPosition = index;
        clampAndSaveCursorPosition();
    }
}

function cursorToFirstChild() {
    let index = getIndexOfFirstChild();
    if (index !== undefined) {
        cursorPosition = index;
        clampAndSaveCursorPosition();
    }
}

function cursorToParent() {
    let parentIndex = getIndexOfParent();
    if (parentIndex !== undefined) {
        cursorPosition = parentIndex;
        clampAndSaveCursorPosition();
    }
}


// Adding

function addNodeDown(type) {
    const indentation = getIndentationAtCursor();
    addEmptyElementAtIndex(type, cursorPosition+1, indentation);
    cursorDown();
}

function addNodeUp(type) {
    const indentation = getIndentationAtCursor();
    addEmptyElementAtIndex(type, cursorPosition, indentation);
    cursorUp();
}

function addNodeRight(type) {
    const indentation = getIndentationAtCursor();
    addEmptyElementAtIndex(type, cursorPosition+1, indentation+1);
    cursorDown();
}

function addNodeLeft(type) {
    const indentation = getIndentationAtCursor();
    increaseIndentUnderCursor();
    addEmptyElementAtIndex(type, cursorPosition, indentation);
    cursorUp();
}

// Grab

function swapDown() {
    swap(cursorPosition, cursorPosition + 1);
}

function swapUp() {
    swap(cursorPosition - 1, cursorPosition);
}

function increaseIndentUnderCursor(text) {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;
    previous[cursorPosition].indentation = curr + 1;
    saveData(previous);
}

function decreaseIndentUnderCursor(text) {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;
    previous[cursorPosition].indentation = Math.max(0, curr - 1);
    saveData(previous);
}

// Action helpers

function getIndentationAtCursor() {
    let previous = getSavedElements();
    return previous[cursorPosition].indentation;
}

function swap(a, b) {
    let previous = getSavedElements();
    if (a < 0 || a >= previous.length || b < 0 || b >= previous.length) {
        return;
    }

    let temp = previous[a];
    previous[a] = previous[b];
    previous[b] = temp;

    if (cursorPosition == a) {
        cursorPosition = b;
        clampAndSaveCursorPosition();
    } else if (cursorPosition == b) {
        cursorPosition = a;
        clampAndSaveCursorPosition();
    }
    saveData(previous);
}

function addEmptyElementAtIndex(type, index, indentation) {
    let element = {"type": type, "text": "", "indentation": indentation};
    let previous = getSavedElements();
    previous.splice(index, 0, element);
    saveData(previous);
    if (index <= cursorPosition) {
        cursorDown();
    }
}



// Cursor

let cursorPosition = 0;

function cursorDown() {
    cursorPosition += 1;
    clampAndSaveCursorPosition();
}

function cursorUp() {
    cursorPosition -= 1;
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
        cursorPosition = position;
    } else {
        cursorPosition = 0;
    }
    clampAndSaveCursorPosition();
}

window.addEventListener("hashchange", readCursorPositionFromHash, false);



// Hierarchical navigation
function getIndexOfParent() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let index = cursorPosition - 1;
    while (index >= 0) {
        if (elements[index].indentation < startingPointIndentation) {
            return index;
        }

        index -= 1;
    }
}

function getIndexOfLastAncestorOfParent() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let index = cursorPosition + 1;
    while (index < elements.length) {
        if (elements[index].indentation < startingPointIndentation) {
            return index - 1;
        }

        index += 1;
    }
    return elements.length - 1;
}


function getIndexOfFirstChild() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    if (cursorPosition == getSavedElements().length - 1) {
        return;
    }

    if (elements[cursorPosition + 1].indentation > startingPointIndentation) {
        return cursorPosition + 1;
    }
}

function getIndexOfNextSibling() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let index = cursorPosition + 1;
    while (index < elements.length) {
        if (elements[index].indentation == startingPointIndentation) {
            return index;
        }
        if (elements[index].indentation < startingPointIndentation) {
            return;
        }

        index += 1;
    }
}

function getIndexOfPreviousSibling() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let index = cursorPosition - 1;
    while (index >= 0) {
        if (elements[index].indentation == startingPointIndentation) {
            return index;
        }
        if (elements[index].indentation < startingPointIndentation) {
            return;
        }

        index -= 1;
    }
}

function getIndexOfLastAncestor() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let index = cursorPosition + 1;
    while (index < elements.length) {
        if (elements[index].indentation <= startingPointIndentation) {
            return index - 1;
        }

        index += 1;
    }
    return elements.length - 1;
}

function getIndexAfterAllAncestorsOfNextSibling() {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAtCursor();

    let sibling = getIndexOfNextSibling();
    if (sibling === undefined) {
        return undefined;
    }

    let index = sibling + 1;
    while (index < elements.length) {
        if (elements[index].indentation <= startingPointIndentation) {
            return index - 1;
        }

        index += 1;
    }
}



// Element storage

function getSavedElements() {
    let data = loadData();
    if (data === null) {
        data = [];
    }
    return data;
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
