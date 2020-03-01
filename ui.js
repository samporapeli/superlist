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
    updateCursorPositionFromHash();

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
    if (editMode === 1 || deadlineEditMode === 1) {
        return;
    }

    let scrollPosition = window.scrollY;

    let elementsWrapper = document.getElementById("code");
    const elements = getSavedElements();
    saveData(elements); // update the text box

    elementsWrapper.innerHTML = "";

    let smallestIndentation = getIndentationAt(cursorPosition) - 1;
    let minIndex = getIndexOfParent(cursorPosition) || 0;
    let maxIndex = getIndexOfLastDescendantOfParent(cursorPosition);

    let directAncestors = [];
    let i = cursorPosition;
    while (i > 0) {
        i = getIndexOfParent(i);
        directAncestors.push(i);
    }

    let lastIndentation = 0;
    elements.forEach(function(element, index) {

        if ((index >= minIndex && index <= maxIndex) || directAncestors.includes(index)) {
            // && element.indentation <= smallestIndentation + 1) {
            let padding = " " + "— ".repeat(element.indentation);// - smallestIndentation);
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
                newDiv.classList.add("list-item");

                let deadlineTimestamp = getEarliestDeadlineOfDescendants(index);
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
                let text = element.text;
                const urlRegex = /(\b([A-Z]+|):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
                text = text.replace(urlRegex, "<a href='$1'>$1</a>")
                textElement.innerHTML = text;
                newDiv.appendChild(textElement);

                newDiv.addEventListener("click", event => {
                    cursorToId(element.id);
                }, false);

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

                    newSpan.addEventListener("click", event => {
                        cursorToId(element.id);
                    }, false);

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

    // Window title
    if (elements.length > 0) {
        const cursorItem = elements[cursorPosition];
        document.title = "Superlist – " + cursorItem.text;
    }

    // Scroll position
    window.scrollTo(0, scrollPosition);

    const cursorElement = getCursorElement();
    if (cursorElement === undefined) {
        return;
    }

    const bounds = cursorElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (bounds.top < windowHeight * 0.3) {
        scrollPosition += bounds.top - windowHeight * 0.3;
    }

    if (bounds.bottom > windowHeight * 0.7) {
        scrollPosition += bounds.bottom - windowHeight * 0.7;
    }

    window.scrollTo(0, scrollPosition);
}
