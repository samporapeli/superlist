window.addEventListener('load', function() {
  updateVisibleList();

  document.addEventListener('keydown', function(event) {
    addElement(event.code);
  });
})

function updateVisibleList() {
  var elementsWrapper = document.getElementById("code");
  const elements = getSavedElements();

  elementsWrapper.innerHTML = '';

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



const localStorageKey = 'todoapp-data';

function saveData(blob) {
  const asText = JSON.stringify(blob)
  localStorage.setItem(localStorageKey, asText);
}

function loadData() {
  const asText = localStorage.getItem(localStorageKey);
  return JSON.parse(asText);
}
