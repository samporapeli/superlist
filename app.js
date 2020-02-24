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

window.addEventListener("load", function() {
  readCursorPositionFromHash();
  updateVisibleList();

  document.addEventListener("keydown", function(event) {
    if (editMode === 1) {
      if (event.code === "Enter") {
        endEditMode();
      }
    } else {
      if (event.code === "Enter") {
        startEditMode();
      } else if (event.code in keysToNodeTypes) {
        addNode(keysToNodeTypes[event.code]);
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

  cursorPosition
  elements.forEach(function(element, index) {
    var newDiv = document.createElement("div");
    var newContent = document.createTextNode(nodeTypesToEmojis[element.type] + " ");
    if (index === cursorPosition) {
      newDiv.classList.add("cursor-node");
    }
    newDiv.appendChild(newContent);

    var textElement = document.createElement("span");
    textElement.innerText = element.text;
    newDiv.appendChild(textElement);
    //element.removeChild(inputElement);

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

function addEmptyElementAfterIndex(type, index) {
  let element = {"type": type, "text": ""};
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



const localStorageKey = "todoapp-data";

function saveData(blob) {
  const asText = JSON.stringify(blob)
  localStorage.setItem(localStorageKey, asText);
}

function loadData() {
  const asText = localStorage.getItem(localStorageKey);
  return JSON.parse(asText);
}
