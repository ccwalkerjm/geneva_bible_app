const _GENESIS_CODE = "GEN";
const _MATTHEW_CODE = "MAT";
let $bibleModal; // = document.querySelector('ons-modal');
let $bookSelector;
let _books;
let _book_index = 0;
let _previous_book_index = 0;
let _chapter_index = 0;
let _current_book;

let _englishWords, _sacredWords;

let $loader;
const _m_opts_easy = 1;
const _m_opts_english = 2;
const _m_opts_sacred = 3;
const _m_opts_ord = 4;

let _m_opts = [];

function setOptions() {
  setEasyMode();
  localStorage.setItem("courserv_geneva_bible_opts", JSON.stringify(_m_opts));
}

function getOptions() {
  const strObjs = localStorage.getItem("courserv_geneva_bible_opts");

  if (strObjs) {
    _m_opts = JSON.parse(strObjs);
  } else {
    _m_opts[_m_opts_easy] = {
      type: "Easy Mode",
      status: true,
      onText: "Turn Off!",
      offText: "Turn On!"
    };

    _m_opts[_m_opts_english] = {
      type: "English",
      status: "false",
      onText: "Switch to Modern!",
      offText: "Switch to Old!"
    };

    _m_opts[_m_opts_sacred] = {
      type: "Sacred Names",
      status: false,
      onText: "Turn Off",
      offText: "Turn On"
    };

    _m_opts[_m_opts_ord] = {
      type: "Book Order",
      status: true,
      onText: "Switch to Alphabetical",
      offText: "Switch to Traditional"
    };
  }
  setEasyMode();
}

String.prototype.replaceAll = function(search, replacement) {
  //const target = this;
  const regex = new RegExp('\\b' + search + '\\b', "g");
  return this.replace(regex, replacement);
};

//

function setEasyMode() {
  _m_opts[_m_opts_easy].status
    ? $(".link-note").show()
    : $(".link-note").hide();
}

//show help menu
function showOptions() {
  const about_options = {
    title: "About",
    messageHTML:
      "<p>Adaptable <strong>Geneva Bible</strong> by<br/><strong>Courtney Walker</strong></p>"
  };
  ons
    .openActionSheet({
      //title: 'Menu',
      cancelable: true,
      buttons: [
        "About",
        _m_opts[_m_opts_easy].type +
          ":" +
          (_m_opts[_m_opts_easy].status
            ? _m_opts[_m_opts_easy].onText
            : _m_opts[_m_opts_easy].offText),
        _m_opts[_m_opts_english].type +
          ":" +
          (_m_opts[_m_opts_english].status
            ? _m_opts[_m_opts_english].onText
            : _m_opts[_m_opts_english].offText),
        _m_opts[_m_opts_sacred].type +
          ":" +
          (_m_opts[_m_opts_sacred].status
            ? _m_opts[_m_opts_sacred].onText
            : _m_opts[_m_opts_sacred].offText),
        _m_opts[_m_opts_ord].type +
          ":" +
          (_m_opts[_m_opts_ord].status
            ? _m_opts[_m_opts_ord].onText
            : _m_opts[_m_opts_ord].offText),
        {
          label: "Cancel",
          icon: "md-close"
        }
      ]
    })
    .then(function(index) {
      if (index === 0) {
        return ons.notification.alert(about_options);
      } else if (index > 0 && index < _m_opts.length) {
        _m_opts[index].status = !_m_opts[index].status;
        setOptions();
        switch (index) {
          case _m_opts_english:
          case _m_opts_sacred:
            return selectBook(_book_index, _chapter_index);
        }
      }
    });
}

//list chapters for book
function getChapters(e) {
  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "none";
  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "block";
  $chapterList.innerHTML = "";
  //const substring = "<li><a href";
  const $bookName = $bibleModal.querySelector(".modal-book-name");
  const $modalTitle = $bibleModal.querySelector(".modal-title");
  $bookName.textContent = _books[_book_index].name;
  $modalTitle.textContent = "Select Chapter";
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

function replaceBiggestFirst(xtext, translationList) {
  let transformed_arr = [];
  for (let key in translationList) {
    transformed_arr.push({
      old: key,
      new: translationList[key]
    });
  }
  //arrange with biggest first
  transformed_arr.sort((a, b) => b.old.length - a.old.length);
  console.log("sizes", transformed_arr);
  for (let i = 0; i < transformed_arr.length; i++) {
    xtext = xtext.replaceAll(transformed_arr[i].old, transformed_arr[i].new);
  }
  return xtext;
}

function translate(chapterText) {
  //change to modern words
  if (!_m_opts[_m_opts_english].status) {
    chapterText = replaceBiggestFirst(chapterText, _englishWords);

    //_sacredWords
    if (!_m_opts[_m_opts_sacred].status) {
      chapterText = replaceBiggestFirst(chapterText, _sacredWords);
    }
  }
  return chapterText;
}

//select Chapter
function selectChapter(index) {
  _chapter_index = index || 0; //_chapter_index;
  const $chapSelector = document.querySelector("#chapter-selector");
  const $text = $chapSelector.querySelector(".text");
  $text.innerHTML = (_chapter_index + 1).toString();

  const encoded_text = _current_book[_chapter_index];

  let chapterText = atob(encoded_text);

  chapterText = translate(chapterText);

  $("#chapter").html(chapterText);

  if ($bibleModal.visible) {
    $bibleModal.hide({
      animation: "fade"
    });
  }
}

//select Book
function selectBook(book_index, chapter_index) {
  const $bookSelector = document.querySelector("#book-selector");
  const $text = $bookSelector.querySelector(".text");

  _previous_book_index = _book_index; ///set previous book marker
  _book_index = book_index;

  $text.innerHTML = _books[_book_index].name;

  $loader.show();
  $.get(`books/${_books[_book_index].code}.json`, function(current_book) {
    $loader.hide();
    _current_book = current_book;

    if (typeof chapter_index == "number") selectChapter(chapter_index);
    else getChapters();
  });
}

//list the Books
function populateBooks() {
  const $chapterList = document.querySelector("#chapter-list");
  $chapterList.style.display = "none";

  const $booklist = document.querySelector("#book-list");
  $booklist.style.display = "block";
  $booklist.innerHTML = "";
  const $bookName = $bibleModal.querySelector(".modal-book-name");
  const $modalTitle = $bibleModal.querySelector(".modal-title");
  $bookName.textContent = "";
  $modalTitle.textContent = "Select Book";

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
function returnModal() {
  const $booklist = document.querySelector("#book-list");
  if ($booklist.style.display === "none") {
    populateBooks();
  } else {
    selectBook(_previous_book_index);
    $bibleModal.hide({
      animation: "fade"
    });
  }
}

//load service worker
function load_service_worker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then(function() {
        console.log("Service Worker Registered");
      })
      .catch(function(e) {
        console.log(e);
      });
  }
}

function addCapitalizedWords(words) {
  for (let key in words) {
    let word = words[key];
    words[key.slice(0, 1).toUpperCase() + key.slice(1)] =
      word.slice(0, 1).toUpperCase() + word.slice(1);
  }
  return words;
}

//start application--wait until the app is loaded properly
load_service_worker();
ons.ready(function() {
  getOptions();
  $loader = document.querySelector("#loader");
  $loader.show();
  $.get("english.json", function(englishWords) {
    _englishWords = addCapitalizedWords(englishWords);
    $.get("sacred.json", function(sacredWords) {
      _sacredWords = addCapitalizedWords(sacredWords);
      $.get("books_complete.json", function(books) {
        $loader.hide();
        _books = books;
        // _book_index = 0;
        // _chapter_index = 0;
        $bibleModal = document.querySelector("#bible-selection-modal");
        $bookSelector = document.querySelector("#book-selector");
        $bookSelector.addEventListener("click", populateBooks);
        const $chapSelector = document.querySelector("#chapter-selector");
        $chapSelector.addEventListener("click", getChapters);
        selectBook(0, 0);
      });
    });
  });
});
