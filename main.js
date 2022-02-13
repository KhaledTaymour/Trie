class TrieNode {
  constructor(character, parent) {
    this.parent = parent;
    this.children = {};
    this.endOfWord = null; // creationTime
    this.beginOfWordNode = null;
    this.character = character;
    this.nextAddedWordNode = null;
    this.previouslyAddedWordNode = null;
  }
}

class SearchHistoryHelperTrie {
  constructor() {
    self = this;
    self.root = new TrieNode();
    self.count = 0;
    self.firstAdddedWordNode = null;
    self.lastAddedWordNode = null;
    self.filteredCachedKeywords = [];
  }

  addSearchHistoryItem(value) {
    // remove the word firstly if it was enterd before
    self.removeKeywordHistory(value);

    var cur = self.root;

    var firstCharacterNode = null;

    for (var i = 0; i < value.length; i++) {
      var letter = value[i];
      if (!cur.children[letter]) {
        cur.children[letter] = new TrieNode(letter, cur);
      }
      if (i === 0) {
        firstCharacterNode = cur.children[letter];
      }
      cur = cur.children[letter];
    }
    cur.endOfWord = Date.now();
    cur.beginOfWordNode = firstCharacterNode;

    if (!self.firstAdddedWordNode) {
      cur.previouslyAddedWordNode = "root";
      self.firstAdddedWordNode = cur;
    }
    if (self.lastAddedWordNode) {
      cur.previouslyAddedWordNode = self.lastAddedWordNode;
      self.lastAddedWordNode.nextAddedWordNode = cur;
    }
    self.lastAddedWordNode = cur;

    self.count++;
  }

  removeFirstWordEntry() {
    var cur = self.firstAdddedWordNode;
    if (cur) {
      self.firstAdddedWordNode = cur.nextAddedWordNode;
      cur.endOfWord = null;
      // update prev of the  next
      if (cur.nextAddedWordNode) {
        cur.nextAddedWordNode.previouslyAddedWordNode = null;
        cur.nextAddedWordNode = null;
      }

      if (!Object.keys(cur.children).length) {
        self.treeBranchShake(cur);
      }

      self.count--;
    }
  }

  /**
   * Tree Branch Shaking
   * @param {*} node
   */
  treeBranchShake(node) {
    var cur = node;
    var isFirstRoundDone = false;

    while (cur.parent) {
      if (isFirstRoundDone) {
        if (
          !Object.keys(cur.parent.children).length &&
          cur.parent !== self.root
        ) {
          cur = cur.parent;
          delete cur.parent.children[cur.character];
        } else {
          break;
        }
      } else {
        cur = cur.parent;
        delete cur.parent.children[cur.character];
        isFirstRoundDone = true;
      }
    }
  }

  removeKeywordHistory(keyword) {
    var cur = self.root;
    for (var i = 0; i < keyword.length; i++) {
      var letter = keyword[i];
      var node = cur.children[letter];
      if (node) {
        // check if reached the last character in the search
        if (i === keyword.length - 1) {
          // update firstAdddedWordNode & lastAddedWordNode
          if (self.firstAdddedWordNode === node) {
            self.firstAdddedWordNode = node.nextAddedWordNode;
          }
          if (self.lastAddedWordNode === node) {
            self.lastAddedWordNode = node.previouslyAddedWordNode;
          }

          // update the next of the prev
          if (node.previouslyAddedWordNode) {
            node.previouslyAddedWordNode.nextAddedWordNode =
              node.nextAddedWordNode;
          }
          // update prev of the next
          if (node.nextAddedWordNode) {
            node.nextAddedWordNode.previouslyAddedWordNode =
              node.previouslyAddedWordNode;
          }

          if (Object.keys(node.children).length === 0) {
            // delete whole node
            delete cur.children[letter];
            self.count--;
            return true;
          } else {
            // erasing node properties
            node.endOfWord = null;
            node.nextAddedWordNode = null;
            node.previouslyAddedWordNode = null;
            self.count--;
            return true;
          }
        } else {
          cur = node;
        }
      } else {
        return false; // wrong keyword
      }
    }
  }

  traverse(cur, builtWord, inputValueReg) {
    if (Object.keys(cur.children).length) {
      //visit children of current
      for (var ck in cur.children) {
        var childNode = cur.children[ck];
        if (childNode.endOfWord && inputValueReg.test(builtWord.concat(ck))) {
          self.filteredCachedKeywords.push({
            word: builtWord.concat(ck),
            time: childNode.endOfWord,
          });
        }
        self.traverse(childNode, builtWord.concat(ck), inputValueReg);
      }
    } else {
      builtWord = "";
    }
  }

  getSearchHistoryMatchResultsFromRoot(value) {
    if (value === "") return "no results";
    else {
      var inputValueReg = new RegExp(value.toLowerCase());

      var cur = self.root;
      var builtWord = "";
      //call on root node
      self.traverse(cur, builtWord, inputValueReg);

      return Object.values(self.filteredCachedKeywords)
        .sort((a, b) => b.time - a.time)
        .map((obj) => obj.word);
    }
  }

  getWords(doFilter, inputValueReg) {
    var formedWord = "";

    var curOuter = self.lastAddedWordNode;
    while (curOuter.previouslyAddedWordNode) {
      var wordCreationTime = curOuter.endOfWord;
      var wordBeginNode = curOuter.beginOfWordNode;
      formedWord = curOuter.character;
      var cur = curOuter;

      while (cur !== wordBeginNode) {
        formedWord = cur.parent.character + formedWord;
        cur = cur.parent;
      }

      if (!doFilter || (inputValueReg && inputValueReg.test(formedWord))) {
        self.filteredCachedKeywords.push({
          word: formedWord,
          time: wordCreationTime,
        });
      }
      formedWord = "";
      //#region check if max words count reached for example 5
      // if (self.filteredCachedKeywords.length === 5) {
      //   break;
      // }
      //#endregion
      curOuter = curOuter.previouslyAddedWordNode;
    }
  }

  getSearchHistoryMatchResults(value) {
    self.filteredCachedKeywords = [];
    if (value === "") {
      self.getWords(false);
    } else {
      var inputValueReg = new RegExp(value.toLowerCase());
      self.getWords(true, inputValueReg);
    }
    return Object.values(self.filteredCachedKeywords)
      .sort((a, b) => b.time - a.time)
      .map((obj) => obj.word);
  }
}

const sh = new SearchHistoryHelperTrie();
setTimeout(() => {
  sh.addSearchHistoryItem("and");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("andy");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("andyr");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("ano");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("as");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("xyz");
}, 250);
setTimeout(() => {
  sh.addSearchHistoryItem("xy");
}, 250);
// setTimeout(() => {
//   // sh.removeKeywordHistory("andy");
// }, 250);
setTimeout(() => {
  // console.log(sh.getSearchHistoryMatchResultsFromRoot("a"));
  console.log(sh.getSearchHistoryMatchResults(""));
}, 250);
// setTimeout(() => {
//   // sh.removeFirstWordEntry();
//   // sh.removeFirstWordEntry();
//   // sh.removeFirstWordEntry();
//   // sh.removeFirstWordEntry();
//   // sh.removeFirstWordEntry();
// }, 250);
// setTimeout(() => {
//   console.log(sh);
// }, 250);

const myWords = [
  "One",
  "morning,",
  "when",
  "Gregor",
  "Samsa",
  "woke",
  "from",
  "troubled",
  "dreams,",
  "he",
  "found",
  "himself",
  "transformed",
  "in",
  "his",
  "bed",
  "into",
  "a",
  "horrible",
  "vermin.",
  "He",
  "lay",
  "on",
  "his",
  "armour-like",
  "back,",
  "and",
  "if",
  "he",
  "lifted",
  "his",
  "head",
  "a",
  "little",
  "he",
  "could",
  "see",
  "his",
  "brown",
  "belly,",
  "slightly",
  "domed",
  "and",
  "divided",
  "by",
  "arches",
  "into",
  "stiff",
  "sections.",
  "The",
  "bedding",
  "was",
  "hardly",
  "able",
  "to",
  "cover",
  "it",
  "and",
  "seemed",
  "ready",
  "to",
  "slide",
  "off",
  "any",
  "moment.",
  "His",
  "many",
  "legs,",
  "pitifully",
  "thin",
  "compared",
  "with",
  "the",
  "size",
  "of",
  "the",
  "rest",
  "of",
  "him,",
  "waved",
  "about",
  "helplessly",
  "as",
  "he",
  "looked.",
  "\"What's",
  "happened",
  "to",
  'me?"',
  "he",
  "thought.",
  "It",
  "wasn't",
  "a",
  "dream.",
  "His",
  "room,",
  "a",
  "proper",
  "human",
  "room",
  "although",
  "a",
  "little",
  "too",
  "small,",
  "lay",
  "peacefully",
  "between",
  "its",
  "four",
  "familiar",
  "walls.",
  "A",
  "collection",
  "of",
  "textile",
  "samples",
  "lay",
  "spread",
  "out",
  "on",
  "the",
  "table",
  "-",
  "Samsa",
  "was",
  "a",
  "travelling",
  "salesman",
  "-",
  "and",
  "above",
  "it",
  "there",
  "hung",
  "a",
  "picture",
  "that",
  "he",
  "had",
  "recently",
  "cut",
  "out",
  "of",
  "an",
  "illustrated",
  "magazine",
  "and",
  "housed",
  "in",
  "a",
  "nice,",
  "gilded",
  "frame.",
  "It",
  "showed",
  "a",
  "lady",
  "fitted",
  "out",
  "with",
  "a",
  "fur",
  "hat",
  "and",
  "fur",
  "boa",
  "who",
  "sat",
  "upright,",
  "raising",
  "a",
  "heavy",
  "fur",
  "muff",
  "that",
  "covered",
  "the",
  "whole",
  "of",
  "her",
  "lower",
  "arm",
  "towards",
  "the",
  "viewer.",
  "Gregor",
  "then",
  "turned",
  "to",
  "look",
  "out",
  "the",
  "window",
  "at",
  "the",
  "dull",
  "weather.",
  "Drops",
  "of",
  "rain",
  "could",
  "be",
  "heard",
  "hitting",
  "the",
  "pane,",
  "which",
  "made",
  "him",
  "feel",
  "quite",
  "sad.",
  '"How',
  "about",
  "if",
  "I",
  "sleep",
  "a",
  "little",
  "bit",
  "longer",
  "and",
  "forget",
  "all",
  "this",
  'nonsense",',
  "he",
  "thought,",
  "but",
  "that",
  "was",
  "something",
  "he",
  "was",
  "unable",
  "to",
  "do",
  "because",
  "he",
  "was",
  "used",
  "to",
  "sleeping",
  "on",
  "his",
  "right,",
  "and",
  "in",
];

// for (let i = 0; i < myWords.length; i++) {
//   setTimeout(() => {
//     sh.addSearchHistoryItem(myWords[i]);
//   }, 1);
// }

// setTimeout(() => {
//   console.log(sh);
// }, 250);

// setTimeout(() => {
//   console.log(sh.getSearchHistoryMatchResults(""));
// }, 250);
