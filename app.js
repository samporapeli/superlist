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
let deadlineEditMode = 0;


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

        } else if (deadlineEditMode === 1) {
            if (event.code === "KeyS" || event.code === "Enter") {
                endDeadlineEditMode();
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
                increaseIndent();
                updateVisibleList();
                event.preventDefault();

            } else if (event.code === "ArrowLeft") {
                decreaseIndent();
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

                } else if (event.code === "KeyS") {
                    startDeadlineEditMode();
                    event.preventDefault();

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

        if (editMode === 0 && deadlineEditMode === 0) {
            if (event.code in keysToNodeTypes) {
                setTypeUnderCursor(keysToNodeTypes[event.code]);
                updateVisibleList();
            }
        }
    });

    window.addEventListener("focus", event => {
        pressedKeys = {};
    }, false);

    const button = document.querySelector("button");
    button.addEventListener("click", event => {
        importDataFromTextBox();
        cursorTo(0);
        updateVisibleList();
    });
});



// Rendering

function startEditMode() {
    editMode = 1;

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

function getTextUnderCursor() {
    let previous = getSavedElements();
    return previous[cursorPosition].text;
}

function endEditMode() {
    editMode = 0;
    const inputElement = document.getElementsByClassName("input-text")[0];
    const newText = inputElement.value;
    setTextUnderCursor(newText);
    updateVisibleList();
}

function startDeadlineEditMode() {
    deadlineEditMode = 1;

    const element = getCursorElement();
    const deadline = getDeadlineUnderCursor();

    const span = element.getElementsByClassName("deadline")[0];
    span.innerText = "";

    function addInputWithClass(classname, value) {
        let inputElement = document.createElement("input");
        inputElement.classList.add("input-text");
        inputElement.classList.add(classname);
        inputElement.setAttribute("type", "text");
        inputElement.value = value;
        span.appendChild(inputElement);
        return inputElement;
    }

    let today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let hour = ""; // empty so saving saves an empty date

    if (deadline !== undefined) {
        day = deadline.getDate();
        month = deadline.getMonth() + 1;
        year = deadline.getFullYear();
        hour = deadline.getHours();
    }

    addInputWithClass("deadline-input-day", day).focus();
    addInputWithClass("deadline-input-month", month);
    addInputWithClass("deadline-input-year", year);
    addInputWithClass("deadline-input-hour", hour);
}

function getDeadlineUnderCursor() {
    let previous = getSavedElements();
    let dl = previous[cursorPosition].deadline;
    if (dl !== undefined) {
        return new Date(dl);
    }
}

function endDeadlineEditMode() {
    deadlineEditMode = 0;
    const day = document.getElementsByClassName("deadline-input-day")[0].value;
    let month = document.getElementsByClassName("deadline-input-month")[0].value;
    month -= 1; // js has 0-based month counting
    const year = document.getElementsByClassName("deadline-input-year")[0].value;
    const hour = document.getElementsByClassName("deadline-input-hour")[0].value;

    let dl = new Date(year, month, day, hour, 0, 0, 0);
    if (day == "" || month == "" || year == "" || hour == "") {
        dl = undefined;
    }

    setDeadlineUnderCursor(dl);
    updateVisibleList();
}

function updateVisibleList() {
    var elementsWrapper = document.getElementById("code");
    const elements = getSavedElements();
    saveData(elements); // update the text box

    elementsWrapper.innerHTML = "";

    let smallestIndentation = getIndentationAt(cursorPosition) - 1;
    let minIndex = getIndexOfParent(cursorPosition) || 0;
    let maxIndex = getIndexOfLastAncestorOfParent(cursorPosition);

    let lastIndentation = 0;
    elements.forEach(function(element, index) {

        if (index >= minIndex && index <= maxIndex) {
            // && element.indentation <= smallestIndentation + 1) {
            let padding = "— ".repeat(element.indentation);// - smallestIndentation);
            let paddingSpan = document.createElement("div");
            let paddingText = document.createTextNode(padding);
            paddingSpan.classList.add("padding-lines");
            paddingSpan.appendChild(paddingText);

            let deadlineSpan = document.createElement("div");
            let deadlineText = document.createTextNode("");
            deadlineSpan.classList.add("deadline");
            deadlineSpan.appendChild(deadlineText);

            let emoji = nodeTypesToEmojis[element.type];

            if (element.indentation <= smallestIndentation + 1) {
                var newDiv = document.createElement("div");

                let deadlineTimestamp = getEarliestDeadlineOfAncestors(index);
                if (deadlineTimestamp !== undefined) {
                    let options = {
                        month: "numeric",
                        day: "numeric",
                        weekday: "short",
                        hour: "numeric"};
                    deadlineSpan.innerText = deadlineTimestamp.toLocaleString('fi-FI', options);
                }

                newDiv.appendChild(deadlineSpan);
                newDiv.appendChild(paddingSpan);

                var newContent = document.createTextNode(emoji + " ");
                if (index === cursorPosition) {
                    newDiv.classList.add("cursor-node");
                }
                newDiv.appendChild(newContent);

                var textElement = document.createElement("span");
                textElement.innerText = element.text;
                newDiv.appendChild(textElement);

                elementsWrapper.appendChild(newDiv);

            } else if (element.indentation == smallestIndentation + 2) {
                deadlineSpan.innerText = "";
                if (element.indentation > lastIndentation) {
                    elementsWrapper.appendChild(deadlineSpan);
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

function setDeadlineUnderCursor(deadline) {
    let previous = getSavedElements();
    previous[cursorPosition].deadline = deadline;
    saveData(previous);
}

function removeElementUnderCursor() {
    let previous = getSavedElements();
    if (getIndexOfLastAncestor(cursorPosition) > cursorPosition) {
        alert("Can't remove an element with ancestors.");
        return;
    }
    let index = getIndexOfPreviousSibling(cursorPosition);
    if (index === undefined) {
        // if no siblings, go to parent
        index = (getIndexOfNextSibling(cursorPosition) || cursorPosition) - 1;
        index = Math.max(0, index);
    }
    previous.splice(cursorPosition, 1);
    saveData(previous);
    cursorTo(index);
}

// Navigation with indentations

function cursorToNextSibling() {
    let index = getIndexOfNextSibling(cursorPosition);
    if (index !== undefined) {
        cursorTo(index);
    }
}

function cursorToPreviousSibling() {
    let index = getIndexOfPreviousSibling(cursorPosition);
    if (index !== undefined) {
        cursorTo(index);
    }
}

function cursorToFirstChild() {
    let index = getIndexOfFirstChild(cursorPosition);
    if (index !== undefined) {
        cursorTo(index);
    }
}

function cursorToParent() {
    let index = getIndexOfParent(cursorPosition);
    if (index !== undefined) {
        cursorTo(index);
    }
}


// Adding

function addNodeDown(type) {
    const indentation = getIndentationAt(cursorPosition);
    const index = getIndexOfLastAncestor(cursorPosition) + 1;
    addEmptyElementAtIndex(type, index, indentation);
    cursorTo(index);
}

function addNodeUp(type) {
    const indentation = getIndentationAt(cursorPosition);
    addEmptyElementAtIndex(type, cursorPosition, indentation);
    cursorUp();
}

function addNodeRight(type) {
    const indentation = getIndentationAt(cursorPosition);
    addEmptyElementAtIndex(type, cursorPosition+1, indentation+1);
    cursorDown();
}

function addNodeLeft(type) {
    const indentation = getIndentationAt(cursorPosition);
    increaseIndent();
    addEmptyElementAtIndex(type, cursorPosition, indentation);
    cursorUp();
}

// Grab

function swapDown() {
    const first = cursorPosition;
    const last = getIndexOfLastAncestor(cursorPosition);
    const to = getIndexOfLastAncestorOfNextSibling(cursorPosition);
    if (to === undefined) {
        return;
    }
    moveRangeToPosition(first, last, to);
    cursorTo(to - last + first);
}

function swapUp() {
    const first = cursorPosition;
    const last = getIndexOfLastAncestor(cursorPosition);
    const to = getIndexOfPreviousSibling(cursorPosition);
    if (to === undefined) {
        return;
    }
    moveRangeToPosition(first, last, to);
    cursorTo(to);
}

function increaseIndent() {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;

    // Can't indentate first child
    const parent = getIndexOfParent(cursorPosition);
    if (cursorPosition === 0 || parent === cursorPosition - 1) {
        return;
    }

    const lastAncestor = getIndexOfLastAncestor(cursorPosition);
    for (let index = cursorPosition; index <= lastAncestor; index++) {
        previous[index].indentation += 1;
        console.log(index);
    }

    saveData(previous);
}

function decreaseIndent() {
    let previous = getSavedElements();
    let curr = previous[cursorPosition].indentation || 0;
    if (curr === 0) {
        return;
    }

    // Move to last sibling (but not yet)
    const first = cursorPosition;
    const last = getIndexOfLastAncestor(cursorPosition);
    const to = getIndexOfLastAncestorOfParent(cursorPosition);

    // Decrease indent
    const lastAncestor = getIndexOfLastAncestor(cursorPosition);
    for (let index = cursorPosition; index <= lastAncestor; index++) {
        previous[index].indentation -= 1;
    }
    saveData(previous);

    // Do the moving
    moveRangeToPosition(first, last, to);
    console.log("moving", first, last, to)
    cursorTo(to - last + first);

}

// Action helpers

function getIndentationAt(index) {
    let previous = getSavedElements();
    if (previous.length == 0) {
        return 0;
    }
    return previous[index].indentation;
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
        cursorTo(b);
    } else if (cursorPosition == b) {
        cursorTo(a);
    }
    saveData(previous);
}

function moveRangeToPosition(firstIndex, lastIndex, indexToMoveTo) {
    if (firstIndex > lastIndex) {
        console.log("moveRangeToPosition firstIndex must be <= lastIndex");
        return;
    }

    let elements = getSavedElements();
    let temp = elements.slice(firstIndex, lastIndex+1);
    const chunkLength = lastIndex+1 - firstIndex;

    if (indexToMoveTo < firstIndex) {
        // Make space for the moving elements
        let pointer = lastIndex;
        while (pointer >= indexToMoveTo + chunkLength) {
            elements[pointer] = elements[pointer - chunkLength];
            pointer -= 1;
        }

        // Copy moving elements to new place
        temp.forEach(function(element, index) {
            elements[indexToMoveTo + index] = element;
        });
    } else if (indexToMoveTo > lastIndex) {
        // Make space for the moving elements
        let pointer = firstIndex;
        while (pointer <= indexToMoveTo - chunkLength) {
            elements[pointer] = elements[pointer + chunkLength];
            pointer += 1;
        }

        // Copy moving elements to new place
        temp.forEach(function(element, index) {
            elements[indexToMoveTo - (chunkLength - 1) + index] = element;
        });

    } else {
        // Moved to the same place
        return;
    }

    saveData(elements);
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



// Hierarchical navigation
function getIndexOfParent(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let index = compareTo - 1;
    while (index >= 0) {
        if (elements[index].indentation < startingPointIndentation) {
            return index;
        }

        index -= 1;
    }
}

function getIndexOfLastAncestorOfParent(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let index = compareTo + 1;
    while (index < elements.length) {
        if (elements[index].indentation < startingPointIndentation) {
            return index - 1;
        }

        index += 1;
    }
    return elements.length - 1;
}


function getIndexOfFirstChild(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    if (compareTo == getSavedElements().length - 1) {
        return;
    }

    if (elements[compareTo + 1].indentation > startingPointIndentation) {
        return compareTo + 1;
    }
}

function getIndexOfNextSibling(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let index = compareTo + 1;
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

function getIndexOfPreviousSibling(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let index = compareTo - 1;
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

function getIndexOfLastAncestor(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let index = compareTo + 1;
    while (index < elements.length) {
        if (elements[index].indentation <= startingPointIndentation) {
            return index - 1;
        }

        index += 1;
    }
    return elements.length - 1;
}

function getIndexOfLastAncestorOfNextSibling(compareTo) {
    let elements = getSavedElements();
    const startingPointIndentation = getIndentationAt(compareTo);

    let sibling = getIndexOfNextSibling(compareTo);
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



// Dates/deadlines

function getEarliestDeadlineOfAncestors(index) {
    let elements = getSavedElements();
    let earliestDeadline = undefined;
    let firstIndex = index;
    let lastIndex = getIndexOfLastAncestor(index);

    while (index <= lastIndex) {
        if (elements[index].deadline !== undefined) {
            let newDeadline = new Date(elements[index].deadline);

            if (index === firstIndex || elements[index].type !== "done") {
                if (earliestDeadline === undefined) {
                    earliestDeadline = newDeadline;

                } else if (newDeadline < earliestDeadline) {
                    earliestDeadline = newDeadline;
                }
            }
        }

        index += 1;
    }
    return earliestDeadline;
}



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
