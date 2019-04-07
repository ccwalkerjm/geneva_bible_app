const _MATTHEW_CODE = "MAT";

//sacred phrases for replacements
const _sacredPhrases = {
  Jesus: "Yeshua",
  JESUS: "YESHUA",
  God: "Yahweh",
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

//key components
let $bibleModal;
let $bookSelector;
let $loader;

//bible variables
let _books;
let _book_index = 0;
let _previous_book_index = 0;
let _chapter_index = 0;
let _current_book;
let _englishWords = {};

//options constants and variables
const _m_opts_easy = 1;
const _m_opts_english = 2;
const _m_opts_sacred = 3;
const _m_opts_ord = 4;
const _m_opts_book = 5;
let _m_opts = [];

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

  if (strObjs) {
    _m_opts = JSON.parse(strObjs);
  } else {
    _m_opts[_m_opts_easy] = {
      type: "Help Mode",
      status: true,
      onText: "Turn Off!",
      offText: "Turn On!"
    };

    _m_opts[_m_opts_english] = {
      type: "English",
      status: false,
      onText: "Switch to Modern!",
      offText: "Switch to Old!"
    };

    _m_opts[_m_opts_sacred] = {
      type: "Sacred Names",
      status: true,
      onText: "Turn On",
      offText: "Turn Off"
    };

    _m_opts[_m_opts_ord] = {
      type: "Book Order",
      status: true,
      onText: "Switch to Alphabetical",
      offText: "Switch to Traditional"
    };

    _m_opts[_m_opts_book] = {
      type: "Book Title",
      status: true,
      onText: "Switch to Abbreviation",
      offText: "Switch to Book Name"
    };
  }
  //set version select
  const versionSelector = document.querySelector("#book-version");
  if (_m_opts[_m_opts_english].status && _m_opts[_m_opts_sacred].status)
    versionSelector.selectedIndex = 0;
  else if (!_m_opts[_m_opts_english].status && _m_opts[_m_opts_sacred].status)
    versionSelector.selectedIndex = 1;
  else versionSelector.selectedIndex = 2;

  //set book title
  const titleSelector = document.querySelector("#title-type");
  if (_m_opts[_m_opts_book].status) titleSelector.selectedIndex = 0;
  else titleSelector.selectedIndex = 1;

  //set help
  if (_m_opts[_m_opts_easy].status) showHelp();
}

const setTitle = function(e) {
  switch (e.target.value) {
    case "name":
      _m_opts[_m_opts_book].status = true;
      break;
    case "abbreviation":
      _m_opts[_m_opts_book].status = false;
      break;
  }
  setOptions();
  selectBook(_book_index, _chapter_index);
};

const setVersion = function(e) {
  switch (e.target.value) {
    case "1599":
      _m_opts[_m_opts_english].status = true;
      _m_opts[_m_opts_sacred].status = true;
      break;
    case "modern":
      _m_opts[_m_opts_english].status = false;
      _m_opts[_m_opts_sacred].status = true;
      break;
    case "sacred":
      _m_opts[_m_opts_english].status = false;
      _m_opts[_m_opts_sacred].status = false;
      break;
  }
  setOptions();
  selectBook(_book_index, _chapter_index);
};

const showHelp = function() {
  _m_opts[_m_opts_easy].status = true;
  const messageObj = {
    title: "Help Guide",
    messageHTML:
      "<p>You can now <strong>swipe the screen</strong> horizontally to change to the previous or next chapter.</p>"+
      "<p>To learn about other features press the next button. Otherwise press the cancel button to exit.</p>"+
      "<p>You can always click the question mark at the top-left edge to return to the help Guide.</p>",
    buttonLabels: ["Cancel", "Next"]
  };
  ons.notification.confirm(messageObj).then(function(idx) {
    _m_opts[_m_opts_easy].status = !!idx;
    setOptions();
    if (idx == 0) return;
    nextPopover();
  });
};

//list chapters for book
function getChapters(e) {
  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "none";
  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "block";
  $chapterList.innerHTML = "";
  //const substring = "<li><a href";
  const $modalTitle = $bibleModal.querySelector(".modal-title");
  $modalTitle.textContent = _books[_book_index].name;

  for (let i = 0; i < _books[_book_index].chapters; i++) {
    const $chap_item = document.createElement("ons-list-item");
    $chap_item.innerText = i + 1;
    $chap_item.setAttribute("tappable", true);
    $chap_item.setAttribute("modifier", "tappable chevron");
    $chap_item.setAttribute("onclick", `selectChapter(${i})`);
    $chapterList.append($chap_item);
  }
  if (e && e.target) {
    $bibleModal.show({
      animation: "fade"
    });
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
  for (let key in words) {
    let word = words[key];
    //check if already a capital
    if (key.slice(0, 1) === key.slice(0, 1).toLowerCase()) {
      words[key.slice(0, 1).toUpperCase() + key.slice(1)] =
        word.slice(0, 1).toUpperCase() + word.slice(1);
    }
  }
  return words;
}

function translate(chapterText) {
  if (!_m_opts[_m_opts_english].status) {
    //change to modern words
    chapterText = replaceAllBySizeDescending(
      chapterText,
      addCapitalizedWords(_englishWords)
    );

    if (!_m_opts[_m_opts_sacred].status) {
      //add capitalized first letter phrases
      let ignorePhrases = addCapitalizedWords(_ignoreSacredPhrases);
      let swappedIgnoreValues = {};
      //add unique value  and create a swapped object
      for (key in ignorePhrases) {
        const value = btoa(key);
        ignorePhrases[key] = value;
        swappedIgnoreValues[value] = key;
      }
      console.log("ignore phrases", ignorePhrases);
      console.log("swapped phrases", swappedIgnoreValues);
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

//select Chapter
function selectChapter(index) {
  _chapter_index = index || 0; //_chapter_index;
  const $chapSelector = document.querySelector("#chapter-selector");
  $chapSelector.innerHTML = (_chapter_index + 1).toString();

  const encoded_text = _current_book[_chapter_index];

  let chapterText = atob(encoded_text);

  chapterText = translate(chapterText);

  $("#chapter").html(chapterText);

  setLastChapter();

  if ($bibleModal.visible) {
    $bibleModal.hide({
      animation: "fade"
    });
  }
}

let _current_book_code;

//select Book
function selectBook(book_index, chapter_index) {
  const $bookSelector = document.querySelector("#book-selector");

  _previous_book_index = _book_index; ///set previous book marker
  _book_index = book_index;

  $bookSelector.innerHTML = _m_opts[_m_opts_book].status
    ? _books[_book_index].name
    : _books[_book_index].abbreviation;

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
    $loader.show();
    $.get(`books/${book_code}.json`, get_new_book);
  }
}

//list the Books
function populateBooks() {
  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "none";

  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "block";
  $booklist.innerHTML = "";
  const $modalTitle = $bibleModal.querySelector(".modal-title");
  $modalTitle.textContent = "Books";

  let book_indexes = JSON.parse(JSON.stringify(_books));

  if (!_m_opts[_m_opts_ord].status) {
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
    if (
      _m_opts[_m_opts_ord].status &&
      (book_index === 0 || x_book.code === _MATTHEW_CODE)
    ) {
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

  if (!$bibleModal.visible) {
    $bibleModal.show({
      animation: "fade"
    });
  }
}

//close modal
const manageBackButton = function() {
  if (!$bibleModal.visible) return window.close();
  const $booklist = document.querySelector("#book-list");
  if ($booklist.style.display === "none") {
    populateBooks();
  } else {
    selectBook(_previous_book_index);
    $bibleModal.hide({
      animation: "fade"
    });
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
    target: "#exit",
    message: "Tap this Button to exit the App",
    header: "Exit Button",
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
    header: "Title Title",
    direction: "up"
  }
];

var hidePopover = function() {
  _m_opts[_m_opts_easy].status = false;
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

function setLastChapter() {
  localStorage.setItem(
    STORAGE_LAST_BOOK_CHAPTER_KEY,
    JSON.stringify({
      book_index: _book_index,
      chapter_index: _chapter_index
    })
  );
}

function getLastChapter() {
  try {
    const lastChap = localStorage.getItem(STORAGE_LAST_BOOK_CHAPTER_KEY);
    if (!lastChap) throw new Error("null found");
    const obj = JSON.parse(lastChap);
    _book_index = obj.book_index;
    _chapter_index = obj.chapter_index;
  } catch (e) {
    _book_index = 0;
    _chapter_index = 0;
  }
}

let accept_gesture = true;

function resetGesture() {
  accept_gesture = true;
}

const gestureListner = function(event) {
  const gesture = event.gesture;
  //if (event.type !== 'release') {
  if (
    accept_gesture &&
    Math.abs(gesture.deltaX) > 3 &&
    Math.abs(gesture.deltaY) < 0.2
  ) {
    console.log("gesture:", event.type, event.gesture);
    accept_gesture = false;
    switch (event.type) {
      case "dragleft":
      case "swipeleft":
        get_next_chapter();
        break;
      case "dragright":
      case "swiperight":
        get_previous_chapter();
        break;
    }
    setTimeout(resetGesture, 1000);
  }
  //}
};

ons.ready(function() {
  var gestureEvents = [
    //"release",
    "dragleft",
    "dragright",
    "swipeleft",
    "swiperight"
  ];
  const $chapter = document.querySelector("#chapter");

  for (let i in gestureEvents) {
    $chapter.addEventListener(gestureEvents[i], gestureListner, false);
  }

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
      $bookSelector.addEventListener("click", populateBooks);
      const $chapSelector = document.querySelector("#chapter-selector");
      $chapSelector.addEventListener("click", getChapters);

      //setup backbutton management
      ons.disableDeviceBackButtonHandler();
      $bibleModal = document.querySelector("#bible-selection-modal");
      $bibleModal.onDeviceBackButton = manageBackButton;
      ons.setDefaultDeviceBackButtonListener(manageBackButton);
      getLastChapter();
      selectBook(_book_index, _chapter_index);
    }).fail(function() {
      ons.notification.alert("Network Problem Detected!");
    });
  };

  $loader = document.querySelector("#loader");
  $loader.show();
  $.get("english.json", function(englishWords) {
    process_bible_data(englishWords);
  }).fail(function() {
    process_bible_data();
  });
});
