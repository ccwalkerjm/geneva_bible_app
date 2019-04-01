const _GENESIS_CODE = "GEN";
const _MATTHEW_CODE = "MAT";
let $bibleModal; // = document.querySelector('ons-modal');
let $bookSelector;
let _books;
let _englishWords;
/* let _isEasyMode = true;
let _isModernEnglish = false;
let _isSacredNames = false;
const _ABOUT = 0;  */
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

String.prototype.replaceAll = function (search, replacement) {
  //const target = this;
  return this.replace(new RegExp('(' + search + ')', "g"), replacement);
};


// Find, Replace, Case
String.prototype.replaceAll2 = function (_f, _r, _c) {

  var o = this.toString();
  var r = '';
  var s = o;
  var b = 0;
  var e = -1;
  if (_c) {
    _f = _f.toLowerCase();
    s = o.toLowerCase();
  }

  while ((e = s.indexOf(_f)) > -1) {
    r += o.substring(b, b + e) + _r;
    s = s.substring(e + _f.length, s.length);
    b += e + _f.length;
  }

  // Add Leftover
  if (s.length > 0) {
    r += o.substring(o.length - s.length, o.length);
  }

  // Return New String
  return r;
};
//



function setEasyMode() {
  _m_opts[_m_opts_easy].status ? $('.link-note').show() : $('.link-note').hide();
}


//show help menu
function showOptions() {
  const about_options = {
    title: "About",
    messageHTML: "<p>Adaptable <strong>Geneva Bible</strong> by<br/><strong>Courtney Walker</strong></p>"
  };
  ons.openActionSheet({
    //title: 'Menu',
    cancelable: true,
    buttons: [
      "About",
      _m_opts[_m_opts_easy].type + ":" + (_m_opts[_m_opts_easy].status ? _m_opts[_m_opts_easy].onText : _m_opts[_m_opts_easy].offText),
      _m_opts[_m_opts_english].type + ":" + (_m_opts[_m_opts_english].status ? _m_opts[_m_opts_english].onText : _m_opts[_m_opts_english].offText),
      _m_opts[_m_opts_sacred].type + ":" + (_m_opts[_m_opts_sacred].status ? _m_opts[_m_opts_sacred].onText : _m_opts[_m_opts_sacred].offText),
      _m_opts[_m_opts_ord].type + ":" + (_m_opts[_m_opts_ord].status ? _m_opts[_m_opts_ord].onText : _m_opts[_m_opts_ord].offText),
      {
        label: 'Cancel',
        icon: 'md-close'
      }
    ]
  }).then(function (index) {
    if (index === 0) {
      return ons.notification.alert(about_options);
    } else if (index > 0 && index < _m_opts.length) {
      _m_opts[index].status = !_m_opts[index].status;
      setOptions();
      switch (index) {
        case _m_opts_english:
        case _m_opts_sacred:
          return refreshChapter();
      }
    }
  });
}


//list chapters for book
function getChapters(book_code) {
  const process_chapters = function (html) {
    const $booklist = document.querySelector("#book-list");
    $booklist.style.display = "none";

    const $chapterList = document.querySelector("#chapter-list");
    $chapterList.style.display = "block";
    $chapterList.innerHTML = "";

    const substring = "<li><a href";
    let a = [],
      i = -1;
    let chap_no = 0;
    const $bookName = $bibleModal.querySelector(".modal-book-name");
    const $modalTitle = $bibleModal.querySelector(".modal-title");
    $bookName.textContent = _books[book_code];
    $modalTitle.textContent = "Select Chapter";
    while ((i = html.indexOf(substring, i + 1)) >= 0) {
      const $chap_item = document.createElement("ons-list-item");
      $chap_item.innerText = ++chap_no;
      $chap_item.setAttribute("tappable", true);
      $chap_item.setAttribute("modifier", "tappable chevron");
      $chap_item.setAttribute("onclick", `selectChapter("${chap_no}")`);
      $chapterList.append($chap_item);
    }
    $loader.hide();
  };
  $loader.show();
  $.get(`data/${book_code}.htm`, process_chapters);
}


//process select chapter from clicking next or previous button
function process_select_chapter(e) {
  let node = e.target;
  if (node.tagName !== "ONS-TOOLBAR-BUTTON") {
    node = node.parentNode;
  }
  const book_chapter = node.getAttribute("data-key");
  const book_code = book_chapter.slice(0, 3);
  const chap_no = parseInt(book_chapter.slice(3));
  selectBook(book_code, chap_no);
}



//select Chapter
function selectChapter(chap_no) {
  const $chapSelector = document.querySelector("#chapter-selector");
  const $text = $chapSelector.querySelector(".text");
  $text.innerHTML = chap_no.toString();
  $chapSelector.setAttribute("data-key", chap_no);

  const book_code = $bookSelector.getAttribute("data-key");

  let size = book_code === "PSA" ? 3 : 2;
  let zeros = book_code === "PSA" ? "000" : "00";

  const s = zeros + chap_no.toString(); //book_code;
  const proper_book_chap = book_code + s.substr(s.length - size);

  $loader.show();
  $.get(`data/${proper_book_chap}.htm`, function (r) {
    $loader.hide();
    //alert(proper_book_chap);
    let $chapter = $(r);
    const $chapterLinks = $chapter.find("ul.tnav").first();
    const $previous = document.querySelector("#previous-chapter");

    const previous_link = $($chapterLinks.children()[1])
      .find("a")
      .attr("href");
    if (previous_link === "index.htm") $previous.disabled = true;
    else {
      $previous.disabled = false;
      $previous.setAttribute("data-key", previous_link.split(".")[0]);
      $previous.setAttribute("title", "Prev");
      $previous.addEventListener("click", process_select_chapter, false);
    }

    const $next = document.querySelector("#next-chapter");
    const next_link = $($chapterLinks.children()[3])
      .find("a")
      .attr("href");
    $next.setAttribute("data-key", next_link.split(".")[0]);
    $next.setAttribute("title", "Next");
    $next.addEventListener("click", process_select_chapter, true);

    let chapterText = $chapter.find(".p").html();
    const beforeSpan = '<span class="verse" id=';
    const afterSpan = '</p><p><span class="verse" id=';
    //let splits = chapterText.split(beforeSpan);
    chapterText =
      "<p>" + chapterText.replaceAll(beforeSpan, afterSpan) + "</p>";

    //change to modern words
    if (!_m_opts[_m_opts_english].status)
      for (let key in _englishWords) {
        chapterText = chapterText.replaceAll(key, _englishWords[key]);
      }

    //_sacredWords
    if (!_m_opts[_m_opts_sacred].status)
      for (let key in _sacredWords) {
        chapterText = chapterText.replaceAll(key, _sacredWords[key]);
      }

    $("#chapter").html(chapterText);
    if ($bibleModal.visible) $bibleModal.hide({
      animation: "fade"
    });
  });
}

//select Book
function selectBook(book_code, chap_no) {
  const $bookSelector = document.querySelector("#book-selector");
  const $text = $bookSelector.querySelector(".text");
  $text.innerHTML = _books[book_code];

  $bookSelector.setAttribute("data-key", book_code);
  if (chap_no) selectChapter(chap_no);
  else getChapters(book_code);
}


function refreshChapter() {
  const $bookSelector = document.querySelector("#book-selector");
  const $chapterSelector = document.querySelector("#chapter-selector");
  const book_code = $bookSelector.getAttribute("data-key");
  const chap_no = parseInt($chapterSelector.getAttribute("data-key"));
  selectBook(book_code, chap_no);
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


  let _book_arr = [];
  for (let book_code in _books) {
    _book_arr.push({
      code: book_code,
      name: _books[book_code]
    });
  };


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
    _book_arr.sort(compare);
  }

  for (let i = 0; i < _book_arr.length; i++) {
    const x_book = _book_arr[i];
    if (_m_opts[_m_opts_ord].status && (x_book.code === _GENESIS_CODE || x_book.code === _MATTHEW_CODE)) {
      const $header = document.createElement("ons-list-header");
      $header.textContent = `${
        x_book.code === _GENESIS_CODE ? "Old" : "NEW"
      } Testament`;
      $booklist.append($header);
    }
    const $book_item = document.createElement("ons-list-item");
    $book_item.setAttribute("tappable", true);
    $book_item.setAttribute("modifier", "tappable chevron");
    $book_item.setAttribute("onclick", `selectBook("${x_book.code}")`);
    $book_item.innerText = x_book.name;
    $booklist.append($book_item);
  }
  if (!$bibleModal.visible)
    $bibleModal.show({
      animation: "fade"
    });
}

//close modal
function returnModal() {
  const $booklist = document.querySelector("#book-list");
  if ($booklist.style.display === "none") {
    populateBooks();
  } else {
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
      .then(function () {
        console.log("Service Worker Registered");
      })
      .catch(function (e) {
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

let $loader, _sacredWords;
//start application--wait until the app is loaded properly
load_service_worker();
ons.ready(function () {
  getOptions();
  $loader = document.querySelector("#loader");
  $loader.show();
  $.get("english.json", function (englishWords) {
    _englishWords = addCapitalizedWords(englishWords);
    $.get("sacred.json", function (sacredWords) {
      _sacredWords = addCapitalizedWords(sacredWords);
      $.get("books_short_names.json", function (books) {
        $loader.hide();
        _books = books;
        $bibleModal = document.querySelector("#bible-selection-modal");
        $bookSelector = document.querySelector("#book-selector");
        $bookSelector.addEventListener("click", populateBooks);
        const $chapSelector = document.querySelector("#chapter-selector");
        $chapSelector.addEventListener("click", function () {
          getChapters($bookSelector.getAttribute("data-key"));
          $bibleModal.show({
            animation: "fade"
          });
        });
        selectBook(_GENESIS_CODE, 1);
      });
    });
  });
});