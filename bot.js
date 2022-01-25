// separate lists of possible answer vs words you are allowed to guess



const { answers, dictionary } = require("./dictionary.js");

console.log(answers.length);
console.log(dictionary.length);

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

// 2315 words as possible solutions
// 10657 valid words allowed to be guessed

// Greedy approach: Pick the word that minimises the resulting entropy, on the assumption that words are chosen randomly
// Initially H = log(N)
// When split into k groups of size n_k:
// H = sum_k (n_k / N) H_k = 1/N sum_k n_k log(n_k) => want to minimise the sum of n_k log(n_k)

// denote outcome as 2 = correct, 1 = present, 0 = absent
function match(answer, guess) {
    var guess
    let output = [0, 0, 0, 0, 0];
    // check matches first
    for (let i = 0; i < 5; i++) {
        if (guess[i] == answer[i]) {
            output[i] = 2;
            answer = answer.replaceAt(i, '0'); // ensures double letters handled correctly
            guess = guess.replaceAt(i, '1'); // can't be matched again now

        }
    }
    // check for presence of other letters
    for (let i = 0; i < 5; i++) {
        var index = answer.indexOf(guess[i]);
        if (index != -1) {
            output[i] = 1;
            answer = answer.replaceAt(index, '0');
        }
    }

    return godel(output);
}

// map list to ternary number
function godel(output) {
    return output[0] + 3*output[1] + 9*output[2] + 27*output[3] + 81*output[4];
}
const correct_value = 2*(1 + 3 + 9 + 27 + 81);

function divide(guess, possibleAnswers) {
    var cases = {};
    for (var answer of possibleAnswers) {
        var n = match(answer, guess);
        if (n === correct_value) continue; // no further work once guessed correctly
        if (cases[n] !== undefined) cases[n]++;
        else cases[n] = 1;
    }
    return cases;
}

// like divide, but returns entries rather than their count
function partition(guess, possibleAnswers) {
    var cases = {};
    for (var answer of possibleAnswers) {
        var n = match(answer, guess);
        if (n === correct_value) continue;
        if (cases[n] !== undefined) cases[n].push(answer);
        else cases[n] = [answer];
    }
    return cases;
}

function entropy(guess, possibleAnwers) {
    var cases = divide(guess, possibleAnwers);
    var result = 0;
    // +1 since, even if word now known, still need to actually guess it
    for (var n of Object.values(cases)) result += n * Math.log2(n + 1);
    return result;
}

function pickWord(possibleAnwers) {
    let bestGuess = "";
    let bestScore = Infinity;
    for (const guess of dictionary) {
        const score = entropy(guess, possibleAnwers);
        if (score < bestScore) {
            bestGuess = guess;
            bestScore = score;
        }
    }
    return bestGuess;
}

/*
History of best result:
From greedy: soare, value at depth 2 is 311768
Better:      raile, value at depth 2 is 303117
Even better: roate, value at depth 2 is 301459
*/

// Try soare (best for greedy approach, to get an initial bound)
// pickWord is greedy, this is slightly less greedy by considering all first 2 levels
function pickPair(possibleAnwers){
    // to allow continuing from already known point (will recompute once)
    const upTo = "zooty"; // place to continue from
    
    let bestGuess = "roate"; // best word found yet
    let bestScore = 301460; // just above lower bound on score, as the initial value

    var i = 0; // print guess periodically to allow restarting easily
    for (const guess of dictionary) {
        if (guess < upTo) continue;
        if (++i % 20 == 0) console.log(`Now about to try ${guess}, best so far is ${bestGuess} with score ${bestScore}`);
        
        // TODO: Make this a method similar to divide
        var cases = {};
        for (var answer of possibleAnwers) {
            var n = match(answer, guess);
            if (n === correct_value) continue;
            if (cases[n] !== undefined) cases[n].push(answer);
            else cases[n] = [answer];
        }

        var totalEntropy = 0;

        // now does something similar to pickWord for each subcase, but returning the entropy of it
        for (var subAnswers of Object.values(cases)) {
            let subBestEntropy = Infinity;
            for (const secondGuess of dictionary) {
                const score = entropy(secondGuess, subAnswers);
                if (score < subBestEntropy) {
                    subBestEntropy = score;
                }
            }
            totalEntropy += subBestEntropy * subAnswers.length; // weight by probability of this state
            if (totalEntropy > bestScore) break; // early exit
        }

        if (totalEntropy < bestScore) {
            console.log(`New best first choice found: ${guess}, entropy ${totalEntropy}`);
            bestScore = totalEntropy;
            bestGuess = guess;
        }
    }

    return bestGuess;
}

// Given root, find best 2nd node along each branch based on depth-2 entropy again
// TODO: Take greedy approach to get a first estimate for best score, so can return early more often
function pickSubPairs(possibleAnswers, root) {
    var cases = partition(root, possibleAnswers);
    var results = {};

    console.log(Object.keys(cases).length);
  //  console.log(cases);
    for (const group in cases) {
        // due to change to 'divide', should no longer get this case
        if (group === correct_value) continue; // guessed correct, no need for a lower node
        else {
            results[group] = pickSubPair(group, cases[group]);
        }
        console.log(`Picked word for group ${group}`);
    }

    return results;
}

// Key 0 = clips, about to try synch, best so far is clips with score 1331.7848987017092
// Key 1 = sculk, about to try volae, best so far is sculk with score 183
// Key 2 = aband, about to try volae, best so far is aband with score 4
// Key 3 = snool, about to try volae, best so far is snool with score 182
// Key 4 = croon, about to try volae, best so far is croon with score 269.1894750100962
// Key 5 = aargh, about to try volae, best so far is aargh with score 3
// Key 6 = bludy, about to try volae, best so far is bludy with score 367.1894750100962
// Key 7 = cundy, about to try volae, best so far is cundy with score 26
// Key 8 = acidy, about to try volae, best so far is acidy with score 6
// Key 9 - got to lysin (also best)

// Like pickPair, but expects smaller lists due to already being divided by the best root
function pickSubPair(key, possibleAnswers){
    
    let bestGuess = "";
    let bestScore = Infinity;

    var i = 0; // print guess periodically to allow restarting easily
    for (const guess of dictionary) {
        if (++i % 500 == 0) console.log(`Key ${key}, about to try ${guess}, best so far is ${bestGuess} with score ${bestScore}`);
        
        var cases = partition(guess, possibleAnswers);
        var totalEntropy = 0;

        // now does something similar to pickWord for each subcase, but returning the entropy of it
        for (var subAnswers of Object.values(cases)) {
            let subBestEntropy = Infinity;
            for (const secondGuess of dictionary) {
                const score = entropy(secondGuess, subAnswers);
                if (score < subBestEntropy) {
                    subBestEntropy = score;
                }
            }
            totalEntropy += subBestEntropy * subAnswers.length; // weight by probability of this state
            if (totalEntropy > bestScore) break; // early exit
        }

        if (totalEntropy < bestScore) {
            console.log(`New best first choice found: ${guess}, entropy ${totalEntropy}`);
            bestScore = totalEntropy;
            bestGuess = guess;
        }
    }

    console.log(`Selected ${bestGuess} for key ${key}`);
    return bestGuess;
}



// Given all answers, returns a tree of 2897 nodes, to solve for 2315 possible answers
// Takes about 20s to build the tree
// New tree using best root found from depth 2 entropy: 
function buildTree(possibleAnwers) {
    if (possibleAnwers.length == 1) return { word: possibleAnwers[0] };
    const word = pickWord(possibleAnwers);
    const node = { word };

    var cases = {};
    for (var answer of possibleAnwers) {
        var n = match(answer, word);
        if (cases[n] !== undefined) cases[n].push(answer);
        else cases[n] = [answer];
    }

    for (const group in cases) {
        // due to change to 'divide', should no longer get this case
        if (group === correct_value) continue; // guessed correct, no need for a lower node
        else {
            node[group] = buildTree(cases[group]);
        }
    }

    return node;
}

function buildTreeGivenRoot(possibleAnwers, word) {
    const node = { word };

    var cases = {};
    for (var answer of possibleAnwers) {
        var n = match(answer, word);
        if (cases[n] !== undefined) cases[n].push(answer);
        else cases[n] = [answer];
    }

    for (const group in cases) {
        // due to change to 'divide', should no longer get this case
        if (group === correct_value) continue; // guessed correct, no need for a lower node
        else {
            node[group] = buildTree(cases[group]);
        }
    }

    return node;
}

function treeSize(node) {
    var size = 1;
    for (var n = 0; n < correct_value; n++){
        if (node[n] !== undefined) size += treeSize(node[n]);
    }
    return size;
}

// Tree for all possible solutions has depth 6, so 6 guesses is sufficient every time
function treeDepth(node) {
    var depth = 0;
    for (var n = 0; n < correct_value; n++){
        if (node[n] !== undefined) {
            const d = treeDepth(node[n]);
            if (d > depth) depth = d;
        }
    }
    return depth + 1;
}

async function solve(tree) {
    console.log(`Guess: ${tree.word}`);
    return new Promise(resolve =>
        readline.question("Please enter outcome, using _ = absent, O = present, X = correct: ", outcome => {
            resolve(outcome);
        })
    ).then(outcome => handleInput(tree, outcome.toUpperCase()));
}

async function handleInput(tree, outcome) {
    var value = 0;
    var posValue = 1;
    for (var i = 0; i < 5; i++) {
        if (outcome[i] === 'O') value += posValue;
        else if (outcome[i] == 'X') value += 2*posValue;
        posValue *= 3;
    }
    if (value === correct_value) return console.log("Success!");
    else if (tree[value] === undefined) return console.log("Unable to solve this word...");
    else return solve(tree[value]);
}

exports = {
    divide,
    match,
    entropy,
    pickWord,
    dictionary,
    answers,
    correct_value,
    buildTree,
    solve,
}

// pickPair(answers);
// Takes about 20s, returns tree with 2897 nodes, max depth 6, root soare
// const tree = buildTree(answers);
// Takes about 10s, returns tree with 2899 nodes, max depth 5, root roate!!



// const tree = buildTreeGivenRoot(answers, "roate");
// console.log(`Tree has ${treeSize(tree)} nodes, depth ${treeDepth(tree)}`);
// solve(tree).then(() => readline.close());

console.log(pickSubPairs(answers, "roate"));



// knoll
// roate - guess
// _O___
// snool - guess
// _XX_X
// knoll - correct in 3 guesses