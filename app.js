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

window.addEventListener("load", function() {
  updateVisibleList();

  document.addEventListener("keydown", function(event) {
    if (event.code in keysToNodeTypes) {
      addNode(keysToNodeTypes[event.code]);
    }

    if (event.code === "Backspace") {
      removeLastElement();
    }
    console.log(event.code);
  });
})

function addNode(type) {
  if (type in nodeTypesToEmojis) {
    addElement(nodeTypesToEmojis[type]);
  }
  console.warn("Unrecognized node type: " + type);
}

function updateVisibleList() {
  var elementsWrapper = document.getElementById("code");
  const elements = getSavedElements();

  elementsWrapper.innerHTML = "";

  for (const element of elements) {
    // create a new div element
    var newDiv = document.createElement("div");
    // and give it some content
    var newContent = document.createTextNode(element);
    // add the text node to the newly created div
    newDiv.appendChild(newContent);

    // add the newly created element and its content into the DOM
    elementsWrapper.appendChild(newDiv);
  }
}

function getSavedElements() {
  let data = loadData();
  if (data === null) {
    data = [];
  }
  return data;
}

function addElement(element) {
  let previous = getSavedElements();
  previous.push(element);
  saveData(previous);
  updateVisibleList();
}

function removeLastElement() {
  let previous = getSavedElements();
  previous.pop();
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
