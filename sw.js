// 1. Save the files to the user's device
// The "install" event is called when the ServiceWorker starts up.
// All ServiceWorker code must be inside events.
self.addEventListener('install', function (e) {
    console.log('install');

    // waitUntil tells the browser that the install event is not finished until we have
    // cached all of our files
    e.waitUntil(
        // Here we call our cache "myonsenuipwa", but you can name it anything unique
        caches.open('genevabibleAssets').then(cache => {
            // If the request for any of these resources fails, _none_ of the resources will be
            // added to the cache.
            return cache.addAll([
                'https://ccwalkerjm.github.io/geneva_bible_app/',
                'index.html',
                'index.css',
                'index.js',
                'images/logo16.png',
                'images/logo32.png',
                'images/logo512.png',
                'images/logo192.png',
                'books_complete.json',
                'manifest.json',
                'english.json',
                'sacred.json',
                'css/onsenui.css',
                'css/onsen-css-components.css',
                'js/onsenui.js',
                'js/jquery.js'
            ].concat(bible_data));
        })
    );
});

// 2. Intercept requests and return the cached version instead
self.addEventListener('fetch', function (e) {
    e.respondWith(
        // check if this file exists in the cache
        caches.match(e.request)
        // Return the cached file, or else try to get it from the server
        .then(response => response || fetch(e.request))
    );
});




const bible_data = [
    "books/GEN.json", //Genesis",
    "books/EXO.json", //Exodus",
    "books/LEV.json", //Leviticus",
    "books/NUM.json", //Numbers",
    "books/DEU.json", //Deuteronomy",
    "books/JOS.json", //Joshua",
    "books/JDG.json", //Judges",
    "books/RUT.json", //Ruth",
    "books/1SA.json", //1 Samuel",
    "books/2SA.json", //2 Samuel",
    "books/1KI.json", //1 Kings",
    "books/2KI.json", //2 Kings",
    "books/1CH.json", //1 Chronicles",
    "books/2CH.json", //2 Chronicles",
    "books/EZR.json", //Ezra",
    "books/NEH.json", //Nehemiah",
    "books/EST.json", //Esther",
    "books/JOB.json", //Job",
    "books/PSA.json", //Psalms",
    "books/PRO.json", //Proverbs",
    "books/ECC.json", //Ecclesiastes",
    "books/SNG.json", //Song of Solomon",
    "books/ISA.json", //Isaiah",
    "books/JER.json", //Jeremiah",
    "books/LAM.json", //Lamentations",
    "books/EZK.json", //Ezekiel",
    "books/DAN.json", //Daniel",
    "books/HOS.json", //Hosea",
    "books/JOL.json", //Joel",
    "books/AMO.json", //Amos",
    "books/OBA.json", //Obadiah",
    "books/JON.json", //Jonah",
    "books/MIC.json", //Micah",
    "books/NAM.json", //Nahum",
    "books/HAB.json", //Habakkuk",
    "books/ZEP.json", //Zephaniah",
    "books/HAG.json", //Haggai",
    "books/ZEC.json", //Zechariah",
    "books/MAL.json", //Malachi",
    "books/MAT.json", //Matthew",
    "books/MRK.json", //Mark",
    "books/LUK.json", //Luke",
    "books/JHN.json", //John",
    "books/ACT.json", //Acts",
    "books/ROM.json", //Romans",
    "books/1CO.json", //1 Corinthians",
    "books/2CO.json", //2 Corinthians",
    "books/GAL.json", //Galatians",
    "books/EPH.json", //Ephesians",
    "books/PHP.json", //Philippians",
    "books/COL.json", //Colossians",
    "books/1TH.json", //1 Thessalonians",
    "books/2TH.json", //2 Thessalonians",
    "books/1TI.json", //1 Timothy",
    "books/2TI.json", //2 Timothy",
    "books/TIT.json", //Titus",
    "books/PHM.json", //Philemon",
    "books/HEB.json", //Hebrews",
    "books/JAS.json", //James",
    "books/1PE.json", //1 Peter",
    "books/2PE.json", //2 Peter",
    "books/1JN.json", //1 John",
    "books/2JN.json", //2 John",
    "books/3JN.json", //3 John",
    "books/JUD.json", //Jude",
    "books/REV.json", //Revelation"
];