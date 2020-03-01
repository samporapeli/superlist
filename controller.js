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
    if (getIndexOfLastDescendant(cursorPosition) > cursorPosition) {
        alert("Can't remove an element with descendants.");
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
    const index = getIndexOfLastDescendant(cursorPosition) + 1;
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
    const last = getIndexOfLastDescendant(cursorPosition);
    const to = getIndexOfLastDescendantOfNextSibling(cursorPosition);
    if (to === undefined) {
        return;
    }
    moveRangeToPosition(first, last, to);
    cursorTo(to - last + first);
}

function swapUp() {
    const first = cursorPosition;
    const last = getIndexOfLastDescendant(cursorPosition);
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

    const lastDescendant = getIndexOfLastDescendant(cursorPosition);
    for (let index = cursorPosition; index <= lastDescendant; index++) {
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
    const last = getIndexOfLastDescendant(cursorPosition);
    const to = getIndexOfLastDescendantOfParent(cursorPosition);

    // Decrease indent
    const lastDescendant = getIndexOfLastDescendant(cursorPosition);
    for (let index = cursorPosition; index <= lastDescendant; index++) {
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

function getIndexOfLastDescendantOfParent(compareTo) {
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

function getIndexOfLastDescendant(compareTo) {
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

function getIndexOfLastDescendantOfNextSibling(compareTo) {
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

function getEarliestDeadlineOfDescendants(index) {
    let elements = getSavedElements();
    let earliestDeadline = undefined;
    let firstIndex = index;
    let lastIndex = getIndexOfLastDescendant(index);

    while (index <= lastIndex) {
        if (elements[index].deadline !== undefined) {
            let newDeadline = new Date(elements[index].deadline);

            if (index === firstIndex ||
                (elements[index].type !== "done" && elements[index].type !== "cancelled")) {
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
