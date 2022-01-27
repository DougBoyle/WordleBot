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
        if (group < 190) continue;
        // due to change to 'divide', should no longer get this case
        if (group === correct_value) continue; // guessed correct, no need for a lower node
        else {
            results[group] = pickSubPair(group, cases[group]);
        }
        console.log(`Picked word for group ${group}`);
    }

    return results;
}

// TODO: May want to check for 1 vs 2 depth on keys that had integer entropy, implies trivial answer
const mapping = {
  '0': 'clips',
  '1': 'sculk',
  '2': 'aband',
  '3': 'snool',
  '4': 'croon',
  '5': 'aargh',
  '6': 'bludy',
  '7': 'cundy',
  '8': 'acidy',
  '9': 'lysin',
  '10': 'carrs',
  '11': 'lapin',
  '12': 'linos',
  '13': 'macon',
  '14': 'aband',
  '15': 'liman',
  '16': 'balms',
  '17': 'aahed',
  '18': 'chins',
  '19': 'dicks',
  '21': 'aahed',
  '22': 'abaca',
  '24': 'acyls',
  '25': 'aahed',
  '26': 'aahed',
  '27': 'snift',
  '28': 'scuft',
  '29': 'aahed',
  '30': 'lupin',
  '31': 'shott',
  '33': 'mucin',
  '34': 'bohos',
  '35': 'abacs',
  '36': 'clint',
  '37': 'alway',
  '39': 'aboil',
  '40': 'abaca',
  '41': 'aahed',
  '42': 'aland',
  '45': 'knish',
  '46': 'crims',
  '51': 'abaca',
  '53': 'aahed',
  '54': 'hinds',
  '55': 'beigy',
  '56': 'aahed',
  '57': 'chins',
  '58': 'abaca',
  '60': 'humfs',
  '61': 'fawny',
  '63': 'snipy',
  '64': 'abamp',
  '65': 'aahed',
  '66': 'aahed',
  '70': 'aahed', // TODO: Work out what's happening here, should at least guess one of the options
  '72': 'aahed',
  '73': 'aahed',
  '78': 'aahed',
  '81': 'lenes',
  '82': 'feued',
  '83': 'lupin',
  '84': 'pylon',
  '85': 'erned',
  '87': 'wynds',
  '88': 'mawks',
  '89': 'advew',
  '90': 'genal',
  '91': 'gambs',
  '92': 'calmy',
  '93': 'abcee',
  '94': 'aahed',
  '99': 'bialy',
  '100': 'bandy',
  '101': 'acold',
  '108': 'seeld',
  '109': 'ernes',
  '110': 'biccy',
  '111': 'besot',
  '112': 'attar',
  '113': 'aahed',
  '114': 'milch',
  '115': 'ablow',
  '117': 'clept',
  '118': 'tweel',
  '126': 'enols',
  '127': 'aahed',
  '128': 'aahed',
  '135': 'plesh',
  '136': 'aahed',
  '138': 'aahed',
  '144': 'aahed',
  '145': 'aahed',
  '153': 'aahed',
  '162': 'nidus',
  '163': 'piums',
  '164': 'adsum',
  '165': 'snick',
  '166': 'phons',
  '168': 'gusli',
  '169': 'bachs',
  '170': 'aargh',
  '171': 'mauls',
  '172': 'aglus',
  '173': 'aalii',
  '174': 'aband',
  '175': 'aahed',
  '180': 'glisk',
  '181': 'crags',
  '189': 'cuish',
  '190': 'bices',
  '192': 'slank',
  '193': 'alaps',
  '198': 'abash',
  '201': 'aahed',
  '207': 'gleek',
  '208': 'abacs',
  '216': 'muils',
  '217': 'ablow',
  '219': 'abacs',
  '220': 'aahed',
  '223': 'aahed',
  '224': 'aahed',
  '225': 'chubs',
  '234': 'balks',
  '235': 'abaci',
  '237': 'aahed'
};


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