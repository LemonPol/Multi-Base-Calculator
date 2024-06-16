const equationBox = document.getElementById("equation-box");
const equationOutputDecimal = document.getElementById("equation-output-dec");
const equationOutputHex = document.getElementById("equation-output-hex");
const equationOutputBinary = document.getElementById("equation-output-bin");

var equationArray = [];

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
                valueStack.push(doMath(valueStack.pop(), valueStack.pop(), operatorStack.pop()));
            }
            operatorStack.pop();
        }

        if (input.charAt(i) == "+" || input.charAt(i) == "-" || input.charAt(i) == "*" || input.charAt(i) == "/" || input.charAt(i) == "^") {
            while (operatorStack.length > 0 && getPrecedence(operatorStack[operatorStack.length-1]) >= getPrecedence(input.charAt(i))) {
                valueStack.push(doMath(valueStack.pop(), valueStack.pop(), operatorStack.pop()));
            }
            operatorStack.push(input.charAt(i));
        }

    }

    while (operatorStack.length > 0) {
        valueStack.push(doMath(valueStack.pop(), valueStack.pop(), operatorStack.pop()));
    }

    if (valueStack.length > 0 && !isNaN(valueStack[0])) {
        return [valueStack[0], valueStack[0].toString(16), valueStack[0].toString(2)]
    } else {
        return ["","",""];
    }

}


function doMath(t1, t2, op) {
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

var containerNum = 0;

function createNewInput() {
    let newContainer = document.createElement("div");
    newContainer.classList.add("equation-container");
    newContainer.id = containerNum++;

    let newInput = document.createElement("input");
    newInput.type = "text";
    newInput.classList.add("input");
    newInput.id = "input_" + containerNum; 

    let newOutput = document.createElement("p");
    newOutput.classList.add("output");
    newOutput.textContent = "= ";
    newOutput.id = "output_" + containerNum; 

    let newSelector = document.createElement("select");
    newSelector.classList.add("selector");
    newSelector.innerHTML = `
        <option value="0">Dec</option>
        <option value="1">Hex</option>
        <option value="2">Bin</option>
    `;
    newSelector.id = "selector_" + containerNum;

    newContainer.appendChild(newInput);
    newContainer.appendChild(newOutput);
    newContainer.appendChild(newSelector);

    let container = document.getElementById("container");
    container.appendChild(newContainer);

    equationArray.push({
        "container" : newContainer,
        "input" : newInput,
    });

    let deleteKeyPressed = false;

    newInput.addEventListener("keydown", (event) => {
        let index = equationArray.findIndex(elem => elem.container == newContainer);
        if (event.key == "Backspace" && newInput.value == "" && equationArray.length > 1) {
            deleteKeyPressed = true;
            equationArray.splice(index, 1);
            newContainer.remove();
            newInput.remove();
            index == 0 ? equationArray[index].input.focus() : equationArray[index-1].input.focus();
            return;
        }
        if (event.key != "Backspace" && event.key != "ArrowUp" && newInput == equationArray[equationArray.length-1].input) {
            createNewInput();
        }
        if (event.key == "ArrowUp" && index != 0) {
            equationArray[index-1].input.focus();
        }
        if (event.key == "Enter" || event.key == "ArrowDown") {
            equationArray[index+1].input.focus();
        }
        console.log(event.key);
    });

    newInput.addEventListener("input", () => {
        newOutput.innerHTML = "= " + evaluateEquation(newInput.value)[newSelector.value];
    });

    newSelector.addEventListener("input", () => {
        newOutput.innerHTML = "= " + evaluateEquation(newInput.value)[newSelector.value];
    })

}

createNewInput();