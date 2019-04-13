const _MATTHEW_CODE = "MAT";

//sacred phrases for replacements
const _sacredPhrases = {
  Jesus: "Yeshua",
  JESUS: "YESHUA",
  God: "Yahweh",
  "Jehovah-jireh": "Yahweh-jireh",
  "Jesus Christ": "Yeshua, the Messiah",
  Christ: "Messiah"
};

//ignore these sacred replacements
const _ignoreSacredPhrases = {
  "my God": "",
  "lord God": "",
  "our God": "",
  "living God": "",
  "the God": ""
};

let _currentPageId;
let _navigator;
//main page
let $mainPage;

//key components
let $bookSelector;
let $loader;

//bible variables
let _books;
let _book_index = 0;
let _chapter_index = 0;
let _current_book;
let _englishWords = {};

//options constants and variables
let _m_opts = {};

//storage key for the last book/chapter
const STORAGE_LAST_BOOK_CHAPTER_KEY = "courserv_geneva_bible_app_last_chapter";
//storage key for english words
const STORAGE_ENGLISH_WORDS_KEY = "courserv_english_words_key";
//storage key for the options
const STORAGE_OPTIONS_KEY = "courserv_geneva_bible_opts";

String.prototype.replaceAll = function(search, replacement, isSpecial) {
  //const target = this;
  let limiter = "\\b";
  if (isSpecial) limiter = "";
  const regex = new RegExp(limiter + search + limiter, "g");
  return this.replace(regex, replacement);
};

function setOptions() {
  localStorage.setItem(STORAGE_OPTIONS_KEY, JSON.stringify(_m_opts));
}

function getOptions() {
  const strObjs = localStorage.getItem(STORAGE_OPTIONS_KEY);

  try {
    if (!strObjs) throw "null _m_opts";
    _m_opts = JSON.parse(strObjs);
    const validity_check =
      typeof _m_opts.helpMode === "boolean" &&
      typeof _m_opts.version === "number" &&
      typeof _m_opts.order === "boolean" &&
      typeof _m_opts.title === "boolean";
    if (!validity_check) {
      throw "bad format";
    }
  } catch (e) {
    _m_opts = {
      helpMode: true,
      version: 0, //old , modern, sacred
      order: true, //true = tradional , false = alphabetical
      title: true //true = normal , false = abbreviation
    };
  }
  //set version
  const versionSelector = document.querySelector("#book-version");
  versionSelector.selectedIndex = _m_opts.version;

  //set book title
  const titleSelector = document.querySelector("#title-type");
  titleSelector.selectedIndex = _m_opts.title ? 0 : 1;
}

const setOrder = function(e) {
  _m_opts.order = e.target.selectedIndex === 0;
  setOptions();
  populateBooks(true);
};

const setTitle = function(e) {
  _m_opts.title = e.target.selectedIndex === 0;
  setOptions();
  selectBook(_book_index, _chapter_index);
};

const setVersion = function(e) {
  _m_opts.version = e.target.selectedIndex;
  setOptions();
  selectBook(_book_index, _chapter_index);
};

const helpGuideSelector = function(e) {
  const idx = e.target.selectedIndex;
  $(".help-options").hide();
  $(".help-options")
    .eq(idx)
    .show();
};

const showHelp = function() {
  _m_opts.helpMode = true;
  const messageObj = {
    title: "Help Guide",
    messageHTML: document.querySelector("#helpNotes").innerHTML,
    buttonLabels: ["Cancel", "Next"]
  };
  ons.notification.confirm(messageObj).then(function(idx) {
    _m_opts.helpMode = !!idx;
    setOptions();
    if (idx == 0) return;
    nextPopover();
  });
};

//list chapters for book
function getChapters(e) {
  const $bookOrder = document.querySelector("#book-order");
  $bookOrder.style.display = "none";
  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "none";
  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "block";
  $chapterList.innerHTML = "";
  //const substring = "<li><a href";
  const $modalTitle = document.querySelector(".modal-title");
  $modalTitle.textContent = _books[_book_index].name;

  for (let i = 0; i < _books[_book_index].chapters; i++) {
    const $chap_item = document.createElement("ons-list-item");
    $chap_item.innerText = i + 1;
    $chap_item.setAttribute("tappable", true);
    $chap_item.setAttribute("modifier", "tappable chevron");
    $chap_item.setAttribute("onclick", `selectChapter(${i})`);
    $chapterList.append($chap_item);
  }
}

function get_previous_chapter() {
  if (_chapter_index === 0) {
    if (_book_index === 0) _book_index = _books.length - 1;
    else _book_index -= 1;
    _chapter_index = _books[_book_index].chapters - 1;
  } else {
    _chapter_index -= 1;
  }
  selectBook(_book_index, _chapter_index);
}

function get_next_chapter() {
  if (_chapter_index === _books[_book_index].chapters - 1) {
    if (_book_index === _books.length - 1) _book_index = 0;
    else _book_index += 1;
    _chapter_index = 0;
  } else {
    _chapter_index += 1;
  }
  selectBook(_book_index, _chapter_index);
}

function replaceAllBySizeDescending(xtext, translationList) {
  let transformed_arr = [];
  for (let key in translationList) {
    transformed_arr.push({
      old: key,
      new: translationList[key]
    });
  }
  //arrange with biggest first
  transformed_arr.sort((a, b) => b.old.length - a.old.length);
  for (let i = 0; i < transformed_arr.length; i++) {
    xtext = xtext.replaceAll(transformed_arr[i].old, transformed_arr[i].new);
  }
  return xtext;
}

function replaceAllWithList(xtext, translationList, isSpecial) {
  for (let key in translationList) {
    xtext = xtext.replaceAll(key, translationList[key], isSpecial);
  }
  return xtext;
}

//capitalize first word
function addCapitalizedWords(words) {
  let expandedWords = JSON.parse(JSON.stringify(words));
  for (let key in expandedWords) {
    let word = expandedWords[key];
    //check if already a capital
    if (
      key.slice(0, 1) === key.slice(0, 1).toLowerCase() &&
      key.split(" ") === 1
    ) {
      expandedWords[key.slice(0, 1).toUpperCase() + key.slice(1)] =
        word.slice(0, 1).toUpperCase() + word.slice(1);
    }
  }
  return expandedWords;
}

function translate(chapterText) {
  if (_m_opts.version > 0) {
    //change to modern words
    chapterText = replaceAllBySizeDescending(
      chapterText,
      addCapitalizedWords(_englishWords)
    );

    if (_m_opts.version === 2) {
      //add capitalized first letter phrases
      let ignorePhrases = addCapitalizedWords(_ignoreSacredPhrases);
      let swappedIgnoreValues = {};
      //add unique value  and create a swapped object
      for (key in ignorePhrases) {
        const value = btoa(key);
        ignorePhrases[key] = value;
        swappedIgnoreValues[value] = key;
      }
      //mark ignore phrases
      chapterText = replaceAllWithList(chapterText, ignorePhrases);
      //_sacredPhrases
      chapterText = replaceAllWithList(chapterText, _sacredPhrases);
      //reverse ignore phrases
      chapterText = replaceAllWithList(chapterText, swappedIgnoreValues, true);
    }
  }
  return chapterText;
}

function setVerseArray(chapterText) {
  return chapterText
    .split("</p>")
    .filter(x => x.slice(0, 3) === "<p>")
    .map(x => x.slice(3).trim())
    .filter(x => x)
    .map(x => x.replace(/<span[^>]*>.*?<\/span>/, ""));
}

//select Chapter
function selectChapter(index) {
  _chapter_index = index || 0; //_chapter_index;

  //set book title
  const $bookSelector = document.querySelector("#book-selector");
  $bookSelector.innerHTML = _m_opts.title
    ? _books[_book_index].name
    : _books[_book_index].abbreviation;

  //set chapter no
  const $chapSelector = document.querySelector("#chapter-selector");
  $chapSelector.innerHTML = (_chapter_index + 1).toString();

  const encoded_text = _current_book[_chapter_index];

  let chapterText = atob(encoded_text);

  chapterText = translate(chapterText);

  let verses = setVerseArray(chapterText);

  const $chapter = document.getElementById("chapter");
  $chapter.innerHTML = "";
  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];

    const verseTextNode = document.createElement("textarea");
    verseTextNode.setAttribute("readonly", "readonly");
    verseTextNode.setAttribute("class", "textarea textarea--transparent verse"); //textarea textarea--transparent
    verseTextNode.style.width = (_maxWidth - 100).toString() + "px";
    verseTextNode.innerText = verse;

    const verseNo = document.createElement("label");
    verseNo.setAttribute("class", "verse");
    verseNo.setAttribute("tappable", "true");
    verseNo.addEventListener("click", copyToClip);
    verseNo.innerHTML = `${i + 1}&nbsp;`;

    const verseP = document.createElement("p");
    verseP.setAttribute("class", "verse");
    verseP.appendChild(verseNo);
    verseP.appendChild(verseTextNode); //verseTxtNode);

    const $verseItem = document.createElement("ons-list-item");
    $verseItem.setAttribute("modifier", "material"); // nodivider");
    $verseItem.appendChild(verseP); //.innerHTML = `<p style=""><label tappable class="verse">${i+1}&nbsp;</label>${verse}</p>`;

    $chapter.appendChild($verseItem);
  }
  _previous_book_chapter = getSavedChapter();
  saveChapter();
  if (_currentPageId !== $mainPage.id) _navigator.popPage();
  else alignVerses();
}

//previous book index and chapter index
let _previous_book_chapter = [0, 0];

//align verses properly in textarea....
function alignVerses() {
  //scroll to top
  const [lastBookIdx, lastChapterIdx] = _previous_book_chapter;
  const isSameChapter =
    lastBookIdx === _book_index && lastChapterIdx === _chapter_index;
  if (!isSameChapter) $mainPage.scrollTop = 0;
  // we use the "data-adaptheight" attribute as a marker
  const $chapter = $mainPage.querySelector("#chapter");
  var textAreas = [].slice.call($chapter.querySelectorAll("textarea"));
  textAreas.forEach(function(el) {
    //var minHeight = el.scrollHeight;
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    // set the height to 0 in case of it has to be shrinked
    //el.style.height = 0;
    // set the correct height
    // el.scrollHeight is the full height of the content, not just the visible part
    el.style.height = el.scrollHeight + diff + "px";
  });
  //set help
  if (_m_opts.helpMode) showHelp();
}

function getVersionName() {
  switch (_m_opts.version) {
    case 0:
      return "Geneva 1599";
    case 1:
      return "CCW Geneva Modern English Version";
    case 2:
      return "CCW Geneva Sacred Name Version";
  }
}

const copyToClip = function(e) {
  // book - version;
  console.log("verse", e);
  const verseBtn = e.target;
  const listItem = e.target.parentNode;
  const verseTextNode = listItem.querySelector("textarea");
  const copiedText = `${getVersionName()}\n${
    _books[_book_index].name
  } ${_chapter_index + 1}:${verseBtn.innerText} \n${verseTextNode.value}`;
  ons.notification.toast(`Verse: ${verseBtn.innerText} Copied!`, {
    timeout: 5000,
    animation: "lift"
  });
  navigator.clipboard
    .writeText(copiedText)
    .then(() => {
      console.log("copied verse", copiedText);
    })
    .catch(err => {
      // This can happen if the user denies clipboard permissions:
      console.error("Could not copy text: ", err);
    });
};

let _current_book_code;

//select Book
function selectBook(book_index, chapter_index) {
  _book_index = book_index;

  let book_code = _books[_book_index].code;

  const gotoChapter = function() {
    if (typeof chapter_index == "number") selectChapter(chapter_index);
    else getChapters();
  };

  if (book_code === _current_book_code) {
    gotoChapter();
  } else {
    const get_new_book = function(current_book) {
      $loader.hide();
      _current_book_code = book_code;
      _current_book = current_book;
      gotoChapter();
    };
    $loader.querySelector("p#loader-text").innerHTML = "..Loading Bible Book..";
    $loader.show();
    $.get(`books/${book_code}.json`, get_new_book);
  }
}

//list the Books
function populateBooks(selectOrderTriggered) {
  //set select order element
  const $bookOrder = document.querySelector("#book-order");
  $bookOrder.style.display = "inline";
  if (!selectOrderTriggered) $bookOrder.selectedIndex = _m_opts.order ? 0 : 1;

  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "none";

  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "block";
  $booklist.innerHTML = "";
  const $modalTitle = document.querySelector(".modal-title");
  $modalTitle.textContent = "Books";

  let book_indexes = JSON.parse(JSON.stringify(_books));

  if (!_m_opts.order) {
    function compare(a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      // a must be equal to b
      return 0;
    }
    book_indexes.sort(compare);
  }

  for (let i = 0; i < book_indexes.length; i++) {
    const x_book = book_indexes[i];
    const book_index = _books.findIndex(x => x.code === x_book.code);
    if (_m_opts.order && (book_index === 0 || x_book.code === _MATTHEW_CODE)) {
      const $header = document.createElement("ons-list-header");
      $header.textContent = `${book_index === 0 ? "Old" : "NEW"} Testament`;
      $booklist.append($header);
    }
    const $book_item = document.createElement("ons-list-item");
    $book_item.setAttribute("tappable", true);
    $book_item.setAttribute("modifier", "tappable chevron");
    $book_item.setAttribute("onclick", `selectBook(${book_index})`);
    $book_item.innerText = x_book.name;
    $booklist.append($book_item);
  }
}

const isWrongWordType = function(idx, word) {
  let firstLetter = word.slice(0, 1);
  const common_idx = 0,
    capital_idx = 1,
    phrases_idx = 2;
  switch (idx) {
    case phrases_idx:
      return word.split(" ").length === 1;
    case common_idx:
      return firstLetter !== firstLetter.toLowerCase();
    case capital_idx:
      return firstLetter !== firstLetter.toUpperCase();
  }
};

const loadDictionary = function(event) {
  let words = [];
  let idx = (event && event.index) || 0;
  for (let word in _englishWords) {
    if (word.slice(0, 2) === "__") continue;
    if (isWrongWordType(idx, word)) continue;
    words.push({
      old: word,
      new: _englishWords[word]
    });
  }

  function compare(a, b) {
    if (a.old < b.old) {
      return -1;
    }
    if (a.old > b.old) {
      return 1;
    }
    // a must be equal to b
    return 0;
  }
  words.sort(compare);

  const rowTemplate = function(cell0, cell1, cell2) {
    let cols = [];
    if (cell0) {
      cols.push(`<ons-col width="50px">${cell0}</ons-col>`);
    }
    if (cell1) {
      cols.push(`<ons-col>${cell1}</ons-col>`);
    }
    if (cell2) {
      cols.push(`<ons-col>${cell2}</ons-col>`);
    }
    return cols.join("");
  };

  //set title
  const titleRow = document.createElement("ons-row");
  titleRow.innerHTML = rowTemplate("No", "Old", "New");
  const $titleItem = document.querySelector("ons-list-title");
  $titleItem.setAttribute("modifier", "material"); // nodivider");
  $titleItem.innerHTML = titleRow.outerHTML;
  //$titleItem.appendChild(titleRow); //.innerHTML = `<p style=""><label tappable class="verse">${i+1}&nbsp;</label>${verse}</p>`;

  const $words = document.getElementById("words");
  $words.innerHTML = "";
  for (let i = 0; i < words.length; i++) {
    const itemRow = document.createElement("ons-row");
    const oldWord = words[i].old;
    const newWord = words[i].new;

    itemRow.innerHTML = rowTemplate(i + 1, oldWord, newWord);

    const $wordItem = document.createElement("ons-list-item");
    $wordItem.setAttribute("modifier", "material"); // nodivider");
    $wordItem.appendChild(itemRow); //.innerHTML = `<p style=""><label tappable class="verse">${i+1}&nbsp;</label>${verse}</p>`;
    $words.appendChild($wordItem);
  }
};

//close modal
const viewDictionary = function() {
  _navigator.pushPage("words.html").then();
};

//close modal
const manageBackButton = function() {
  if (_currentPageId !== $mainPage.id) {
    const $booklist = document.querySelector("#book-list");
    if ($booklist.style.display === "none") {
      populateBooks();
    } else {
      [_book_index, _chapter_index] = getSavedChapter();
      _navigator.popPage().then();
    }
  } else {
    window.close();
  }
};

const helpTargets = [
  {
    target: "#help-selector",
    message: "Tap here to get help.",
    header: "Help",
    direction: "down"
  },
  {
    target: "#dictionary",
    message:
      "Tap this Button to view the dictionary between the old english words and the modern words",
    header: "Dictionary",
    direction: "down"
  },
  {
    target: "#book-selector",
    message: "Tap Book Title to Change to another Book",
    header: "Book Selector",
    direction: "down"
  },
  {
    target: "#chapter-selector",
    message: "Tap Chapter No to Change Chapter",
    header: "Chapter Selector",
    direction: "down"
  },
  {
    target: "#search-input",
    message:
      "Search the Bible here. Enter a word and tap the enter key to search the entire Bible.",
    header: "Bible Search",
    direction: "down"
  },
  {
    target: "#book-version",
    message:
      "Select Bible Version Here. 1599 Version, Modern English and Sacred Names",
    header: "Bible Version",
    direction: "up"
  },
  {
    target: "#title-type",
    message:
      "Set Book Title Type; whether the standard name or the abbreviation(code)",
    header: "Chapter Title",
    direction: "up"
  }
];

var hidePopover = function() {
  _m_opts.helpMode = false;
  setOptions();
  var popover = document.getElementById("popover");
  popover.hide();
};

let nextHelp = 0;
var nextPopover = function() {
  const currentTarget = helpTargets[nextHelp];
  const target = document.querySelector(currentTarget.target);
  const popover = document.getElementById("popover");
  if (popover.visible) popover.hide();
  popover.querySelector("h4").innerHTML = currentTarget.header;
  popover.querySelector(".message").innerHTML = currentTarget.message;
  popover.setAttribute("direction", currentTarget.direction);
  popover.show(target);
  if (nextHelp === helpTargets.length - 1) nextHelp = 0;
  else nextHelp++;
};

function saveChapter() {
  localStorage.setItem(
    STORAGE_LAST_BOOK_CHAPTER_KEY,
    JSON.stringify({
      book_index: _book_index,
      chapter_index: _chapter_index
    })
  );
}

function getSavedChapter() {
  try {
    const lastChap = localStorage.getItem(STORAGE_LAST_BOOK_CHAPTER_KEY);
    if (!lastChap) throw new Error("null found");
    const obj = JSON.parse(lastChap);
    return [obj.book_index, obj.chapter_index];
  } catch (e) {
    return [0, 0];
  }
}

const gestureListner = function(event) {
  switch (event.type) {
    //case "dragleft":
    case "swipeleft":
      get_next_chapter();
      break;
    case "swiperight":
      get_previous_chapter();
      break;
    case "doubletap":
      const tapWidth = event.gesture.center.pageX;
      const percent = 20;
      if (tapWidth < (percent / 100) * _maxWidth) get_previous_chapter();
      if (tapWidth > ((100 - percent) / 100) * _maxWidth) get_next_chapter();
  }
};

/////////////////////////////////
//////////////////////////////////
/// seach Bible ///////////////
const closeSeachModal = function() {
  document.querySelector("#search-modal").hide();
};

let _searchedList = [];
const searchBible = async function(e) {
  document.querySelector("#searchedTitle").innerText = "Search Results..";
  _searchedList = [];
  const search_word = e.target.value;
  $loader.querySelector("p#loader-text").innerHTML =
    "..Searching Entire Bible..";
  $loader.show();
  for (let book_idx = 0; book_idx < _books.length; book_idx++) {
    const book_code = _books[book_idx].code;

    const resp = await fetch(`books/${book_code}.json`);
    const book_chapters = await resp.json();

    for (let chap_idx = 0; chap_idx < book_chapters.length; chap_idx++) {
      const encoded_text = book_chapters[chap_idx];
      let chapterText = atob(encoded_text);

      let verses = setVerseArray(chapterText);

      for (let verse_idx = 0; verse_idx < verses.length; verse_idx++) {
        //search chapter
        let verse = verses[verse_idx];

        const regex = new RegExp("\\b" + search_word + "\\b", "gi");
        let m;
        do {
          m = regex.exec(verse);
          if (m) {
            _searchedList.push({
              book_idx: book_idx,
              chapter_idx: chap_idx,
              verse_idx: verse_idx,
              char_index: m.index
            });
          }
        } while (m);
      }
    }
  }
  //console.log(_searchedList);
  $loader.hide();

  if (_searchedList.length === 0) {
    ons.notification.alert("No Result Found!!");
    return;
  }

  const searchModal = document.querySelector("#search-modal");

  var lazySearchedList = document.getElementById("lazy-searched-list");

  document.querySelector("#searchedTitle").innerText =
    "Search Results..Amount Found:" + _searchedList.length;

  lazySearchedList.delegate = {
    createItemContent: function(i) {
      let obj = _searchedList[i];
      let book = _books[obj.book_idx];
      let itemId = "searched-" + i;
      const replaceVerseMarker = ".....loading.....";

      (async function() {
        try {
          const resp = await fetch(`books/${book.code}.json`);
          let book_chapters = await resp.json();
          const encoded_text = book_chapters[obj.chapter_idx];
          let chapterText = atob(encoded_text);

          let verse = setVerseArray(chapterText)[obj.verse_idx];

          let item, chkTimer;
          var chkItem = function() {
            item = document.getElementById(itemId);
            if (item) {
              clearTimeout(chkTimer);
              const offset = 0;
              const startIdx =
                obj.char_index - offset >= 0 ? obj.char_index - offset : 0;
              const endIdx =
                verse.length >= obj.char_index + search_word.length + offset
                  ? obj.char_index + search_word.length + offset
                  : verse.length;
              const enhancedVerse =
                "<p>" +
                verse.slice(0, startIdx) +
                "<strong>" +
                verse.slice(startIdx, endIdx) +
                "</strong>" +
                verse.slice(endIdx) +
                "</p>";
              item.innerHTML = item.innerHTML.replace(
                replaceVerseMarker,
                enhancedVerse
              );
            }
          };
          chkTimer = setInterval(chkItem, 500);
        } catch (e) {
          ons.notification.alert(e.message);
        }
      })();

      return ons.createElement(
        `<ons-list-item id="${itemId}"><p><strong>${i + 1}: ${
          book.name
        } ${obj.chapter_idx + 1}:${obj.verse_idx +
          1}</strong><br/>${replaceVerseMarker}</p></ons-list-item>`
      );
    },
    countItems: function() {
      return _searchedList.length;
    }
  };

  lazySearchedList.refresh();

  searchModal.show();
};
///////////////////////
////////////////////////
//////////////////////////

const process_bible_data = function(receivedWords) {
  try {
    if (receivedWords && typeof receivedWords === "object") {
      //save downloaded words  ---this is not cached.
      localStorage.setItem(
        STORAGE_ENGLISH_WORDS_KEY,
        JSON.stringify(receivedWords)
      );
    }
    //get saved words regardless
    const savedWords = localStorage.getItem(STORAGE_ENGLISH_WORDS_KEY);
    if (!savedWords) throw new Error("Null Saved Words");
    _englishWords = JSON.parse(savedWords);
  } catch (e) {
    console.log("english word error:", e);
    //assumed empty list
    _englishWords = {};
  }

  $.get("books_complete.json", function(books) {
    $loader.hide();
    getOptions();
    _books = books;
    $bookSelector = document.querySelector("#book-selector");
    $bookSelector.addEventListener("click", function(e) {
      _navigator
        .pushPage("bible-selection.html", {
          data: { type: "book" }
        })
        .then();
    });
    const $chapSelector = document.querySelector("#chapter-selector");
    $chapSelector.addEventListener("click", function(e) {
      _navigator
        .pushPage("bible-selection.html", {
          data: { type: "chapter" }
        })
        .then();
    });

    [_book_index, _chapter_index] = getSavedChapter();
    selectBook(_book_index, _chapter_index);
  }).fail(function() {
    ons.notification.alert("Network Problem Detected!");
  });
};

let _maxWidth; // = $mainPage.offsetWidth;
ons.ready(function() {
  _navigator = document.querySelector("#bible-navigator");
  //manage navigator page switching
  window.addEventListener("resize", function(event) {
    if (_currentPageId === "mainPage") {
      _maxWidth = $mainPage.offsetWidth;
      selectBook(_book_index, _chapter_index);
    }
  });
  document.addEventListener("show", function(event) {
    _currentPageId = event.target.id;
    if (_currentPageId === "mainPage") {
      alignVerses(event.target);
    }
  });
  document.addEventListener("init", function(event) {
    _currentPageId = event.target.id;
    const pageData = event.target.data;
    if (_currentPageId === "mainPage") {
      $mainPage = event.target;
      _maxWidth = $mainPage.offsetWidth;

      //set gesture events
      const $chapter = document.querySelector("#chapter");
      const chapterGesture = new ons.GestureDetector($chapter);
      chapterGesture.on("swiperight swipeleft doubletap", gestureListner);

      //load bible Meta json
      $loader = document.querySelector("#loader");
      $loader.querySelector("p#loader-text").innerHTML =
        "..Loading Bible Meta Data..";
      $loader.show();
      $.get("english.json", function(englishWords) {
        process_bible_data(englishWords);
      }).fail(function() {
        process_bible_data();
      });
    } else if (_currentPageId === "bible-selection") {
      //
      switch (pageData.type) {
        case "book":
          return populateBooks();
        case "chapter":
          return getChapters();
      }
    } else if (_currentPageId === "wordPage") {
      //load dictionary
      //dictionarySegment;
      document.addEventListener("postchange", loadDictionary);
      loadDictionary();
    }
  });
});
