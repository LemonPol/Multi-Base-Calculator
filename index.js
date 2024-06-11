function fetchGroups(s) {

    let groupDepth = 0;
    let tokenList = [];
    let groupList = [];

    // Toxenize parenthesis
    for (let i = 0; i < s.length; i++) {

        if (s.charAt(i) == '(') {
            groupDepth++;
            tokenList.push({
                "type" : "open",
                "depth" : groupDepth,
                "index" : i
            });
        }

        if (s.charAt(i) == ')') {
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