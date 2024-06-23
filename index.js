var equationArray = [];
var containerNum = 0;

let parentContainer = document.getElementById("parent");

function fetchGroups(s) {

    let groupDepth = 0;
    let tokenList = [];
    let groupList = [];

    // Toxenize parenthesis
    for (let i = 0; i < s.length; i++) {

        if (s.charAt(i) == "(") {
            groupDepth++;
            tokenList.push({
                "type" : "open",
                "depth" : groupDepth,
                "index" : i
            });
        }

        if (s.charAt(i) == ")") {
            groupDepth--;
            tokenList.push({
                "type" : "close",
                "depth" : groupDepth,
                "index" : i
            });
        }

    }

    // Error handling
    // @todo - create a more robust error handling system
    if (tokenList.length % 2 != 0 || tokenList[tokenList.length - 1].depth != 0) {
        console.log("ERROR: Malformed Parenthesis");
        return;
    }

    // Create groups from tokens
    for (let i = 0; i < tokenList.length - 1; i++) {

        if (tokenList[i].type == "open") {

            for (let j = i+1; j < tokenList.length; j++) {

                if (tokenList[j].depth == tokenList[i].depth - 1 && tokenList[j].type == "close") {
                    groupList.push({
                        "order" : tokenList[i].depth,
                        "start" : tokenList[i].index,
                        "end" : tokenList[j].index
                    });
                    break;
                }

            }

        }

    }

    return groupList;

}

function evaluateEquation(input) {

    if (!parenthesisComplete(input)) {
        return ["","",""];
    }

    valueStack = [];
    operatorStack = []; 

    for (let i = 0; i < input.length; i++) {

        let radix = 10;

        // Ignore whitespace
        if (input.charAt(i) == " ") {
            continue;
        }

        // Check if token is numeric
        if (input.charCodeAt(i) >= 48 && input.charCodeAt(i) <= 57) {
            // Check if current token is a radix specifier ("0x" or "0b")
            if (i < input.length - 2 && input.charAt(i) == "0") {
                if (input.charAt(i+1) == "x") {
                    radix = 16;
                    i += 2
                } else if (input.charAt(i+1) == "b") {
                    radix = 2;
                    i +=2
                }
            }

            let currentVal = 0;

            // Process numeric token
            while (i < input.length && ((input.charCodeAt(i) >= 48 && input.charCodeAt(i) <= 57) || (input.charCodeAt(i) >= 97 && input.charCodeAt(i) <= 102) || (input.charCodeAt(i) >= 65 && input.charCodeAt(i) <= 70))) {
                currentVal = radix*currentVal + parseInt(input.charAt(i), radix);
                i++;
            }

            // Check if number is implicitly multiplying parenthesis 
            if (input.charAt(i) == "(") {
                input = input.slice(0, i+1) + "*" + input.slice(i+1);
            }

            // Processing done, add to value stack
            valueStack.push(currentVal);

        }

        if (input.charAt(i) == "(") {
            operatorStack.push("(");
        }

        if (input.charAt(i) == ")") {

            if (i < input.length-1 && input.charAt(i+1) == "(") {
                input = input.slice(0, i+1) + "*" + input.slice(i+1);
            }

            while (operatorStack[operatorStack.length - 1] != "(") {
                valueStack.push(performOperation (valueStack.pop(), valueStack.pop(), operatorStack.pop()));
            }
            operatorStack.pop();
        }

        if (input.charAt(i) == "+" || input.charAt(i) == "-" || input.charAt(i) == "*" || input.charAt(i) == "/" || input.charAt(i) == "^") {
            while (operatorStack.length > 0 && getPrecedence(operatorStack[operatorStack.length-1]) >= getPrecedence(input.charAt(i))) {
                valueStack.push(performOperation (valueStack.pop(), valueStack.pop(), operatorStack.pop()));
            }
            operatorStack.push(input.charAt(i));
        }

    }

    while (operatorStack.length > 0) {
        valueStack.push(performOperation (valueStack.pop(), valueStack.pop(), operatorStack.pop()));
    }

    if (valueStack.length > 0 && !isNaN(valueStack[0])) {
        return [valueStack[0], valueStack[0].toString(16), valueStack[0].toString(2)]
    } else {
        return ["","",""];
    }

}

// Helper functions for math processing // 

function performOperation (t1, t2, op) {
    switch(op) {
        case "+" : return t2 + t1;
        case "-" : return t2 - t1;
        case "*" : return t2 * t1;
        case "/" : return t1 == 0 ? 0 : parseInt(t2 / t1); 
        case "^" : return Math.pow(t2,t1);
    }
}

function getPrecedence(op) {
    switch(op) {
        case "+" : return 0;
        case "-" : return 0;
        case "*" : return 1;
        case "/" : return 1;
        case "^" : return 2;
    }
}

function parenthesisComplete(s) {
    let result = 0;

    if (s == "") {
        return false;
    }

    for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) == "(") {
            result++;
        } else if (s.charAt(i) == ")") {
            result--;
        }
    }
    return result == 0;
}

function createEquationContainer() {
    // Create new container for equation elements
    let newEquationContainer = document.createElement("div");
    newEquationContainer.classList.add("equation-container");
    newEquationContainer.id = containerNum++;

    // Create fields for equation container
    let newInput = createInput();
    let newOutput = createOutput();
    let newSelector = createSelector();

    // Append fields to equation container
    newEquationContainer.appendChild(newInput);
    newEquationContainer.appendChild(newOutput);
    newEquationContainer.appendChild(newSelector.buttonContainer);
    parentContainer.appendChild(newEquationContainer);

    equationArray.push({
        "container" : newEquationContainer,
        "input" : newInput,
    });

    // Register handling for character pre-processing
    newInput.addEventListener("keydown", (event) => {
        processInput(event, newInput, newEquationContainer);
    });

    // Register handling for output updating
    newInput.addEventListener("input", () => {
        updateOutput(newInput, newOutput, newSelector);
    });

    // Register each selection button 
    for (let i = 0; i < 3; i++) {
        newSelector.buttonArray[i].addEventListener('click', () => {
            const buttons = document.getElementsByName(newSelector.buttonArray[i].name);
            buttons.forEach(btn => btn.classList.remove('active'));
            newSelector.buttonArray[i].classList.add('active');
            newSelector.value = newSelector.buttonArray[i].value;
            updateOutput(newInput, newOutput, newSelector);
        });
    }

    updateOutput(newInput, newOutput, newSelector);

}

// Function to update the output field of an equation box
function updateOutput(newInput, newOutput, newSelector) {
    newOutput.innerHTML = "= " + evaluateEquation(newInput.value)[newSelector.value];
}

// Function to process character input
function processInput(event, input, container) {
    let index = equationArray.findIndex(elem => elem.container == container);
    if (event.key == "Backspace" && input.value == "" && equationArray.length > 1) {
        container.remove();
        input.remove();
        equationArray.splice(index, 1);
        event.preventDefault();
        console.log(index);
        index == 0 ? equationArray[index].input.focus() : equationArray[index-1].input.focus();
        return;
    }
    if (event.key != "Backspace" && event.key != "ArrowUp" && input == equationArray[equationArray.length-1].input) {
        createEquationContainer();
    }
    if (event.key == "ArrowUp" && index != 0) {
        equationArray[index-1].input.focus();
    }
    if (event.key == "Enter" || event.key == "ArrowDown") {
        equationArray[index+1].input.focus();
    }
    //console.log(event.key);
}

function createInput() {
    let newInput = document.createElement("input");
    newInput.type = "text";
    newInput.classList.add("input");
    newInput.id = "input_" + containerNum;
    return newInput;
}

function createOutput() {
    let newOutput = document.createElement("p");
    newOutput.classList.add("output");
    newOutput.textContent = "= ";
    newOutput.id = "output_" + containerNum;
    return newOutput;
}

function createSelector() {
    let buttonContainer = document.createElement("div");
    let labels = ["Dec", "Hex", "Bin"];
    let buttonArray = [];

    buttonContainer.classList.add("button-container");

    function createButton(value, label) {
        let newButton = document.createElement("button");
        newButton.classList.add("toggle-btn");
        newButton.id = "btn_" + containerNum + "_" + value;
        newButton.name = "btn_" + containerNum;
        newButton.textContent = label;
        newButton.value = value;
    
        return newButton;
    }

    for (let i = 0; i < 3; i++) {
        let button = createButton(i, labels[i]);
        buttonContainer.appendChild(button);
        buttonArray[i] = button;
    }

    buttonArray[0].classList.add('active');

    return {
        "buttonContainer" : buttonContainer,
        "buttonArray" : buttonArray,
        "value" : 0,
    }

}



createEquationContainer();