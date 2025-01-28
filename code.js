var userInput;
var textToType;
var timer;

let startTime = 0;

var isText = true;
var duration = 15;

var data;

function loaded() {
  userInput = document.querySelector("#userInput");
  textTypeSelect = document.getElementById("text-type");
  durationSelect = document.getElementById("duration");
  textToType = document.getElementById("text-to-type");
  document
    .querySelector("#text-container")
    .addEventListener("keyup", checkInput);

  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      this.data = data;
      textTypeSelect.addEventListener("change", () => {
        const selectedType = textTypeSelect.value;

        isText = selectedType === "words";
        generateText();
      });

      durationSelect.addEventListener("change", () => {
        duration = durationSelect.value;
        generateText();
      });

      generateText();
    })
    .catch((error) => {
      alert("Error while loading data");
      console.error("Error loading data:", error);
    });
}

function shuffleArray(array) {
  for (var i = array.length - 1; i >= 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function generateText() {
  if (!isText) {
    var list = data["paragraphs"];
    shuffleArray(list);
    list = list.join(" ");
    list = list.split(" ");
    setText(list.slice(0, duration * 10)); // expecting that a user can type max 10 words per second
  } else {
    var words = data["words"];
    shuffleArray(words);
    words = words.join(" ").split(" ");
    let len = duration * 10;
    const wElements = words.slice(0, len);
    document.getElementById("timer").innerText = duration;
    setText(wElements);
  }
}

function addClass(el, name) {
  el.className += " " + name;
}

function removeClass(el, name) {
  el.className = el.className.replace(name, "");
}

function setText(words) {
  currentText = words;
  document.querySelector("#text").innerHTML = "";
  words.forEach((word) => {
    var wordElement = document.createElement("div");
    wordElement.className = "word";
    let letters = word.split("");
    letters.forEach((l) => {
      var e = document.createElement("span");
      e.innerText = l;
      e.className = "letter";
      wordElement.appendChild(e);
    });
    document.querySelector("#text").appendChild(wordElement);
  });

  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");
  setCursor();
}

function gameOver() {
  startTime = 0;
  clearInterval(timer);
  getWpm();
  document.querySelector("#text-container").removeEventListener("keyup", checkInput);
}

function checkInput(e) {
  const text = document.querySelector("#text");
  const key = e.key;
  const currentWord = document.querySelector(".word.current");
  const currentLetter = document.querySelector(".letter.current");
  const expected = currentLetter?.innerHTML || " ";
  const isLetter = key.length === 1 && key !== " ";
  const isSpace = key === " ";
  const isBackspace = key === "Backspace";
  const isFirstLetter = currentLetter === currentWord.firstChild;

  if (document.querySelector("#text-container.over")) {
    return;
  }

  if (startTime < 1 && isLetter) {
    startTime = new Date().getTime();
    timer = setInterval(() => {
      let secs = (new Date().getTime() - startTime) / 1000;

      if (secs >= duration) {
        gameOver();
        return;
      } else {
        document.querySelector("#timer").innerHTML = `${
          duration - Number.parseInt(secs)
        }`;
      }
    }, 1000);
  }

  if (isLetter) {
    if (currentLetter) {
      addClass(currentLetter, key === expected ? "correct" : "incorrect");
      removeClass(currentLetter, "current");
      if (currentLetter.nextSibling) {
        addClass(currentLetter.nextSibling, "current");
      }
    } else {
      const incorrectLetter = document.createElement("span");
      incorrectLetter.innerHTML = key;
      incorrectLetter.className = "letter incorrect extra";
      currentWord.appendChild(incorrectLetter);
    }
  }

  if (isSpace) {
    if (expected !== " ") {
      const lettersToInvalidate = [
        ...document.querySelectorAll(".word.current .letter:not(.correct)"),
      ];
      lettersToInvalidate.forEach((letter) => {
        addClass(letter, "incorrect");
      });
    }
    removeClass(currentWord, "current");
    let sibling = currentWord.nextSibling;

    addClass(sibling, "current");
    if (currentLetter) {
      removeClass(currentLetter, "current");
    }
    addClass(currentWord.nextSibling.firstChild, "current");
  }

  if (isBackspace) {
    if (currentLetter && isFirstLetter) {
      removeClass(currentWord, "current");
      addClass(currentWord.previousSibling, "current");
      removeClass(currentLetter, "current");
      addClass(currentWord.previousSibling.lastChild, "current");
      removeClass(currentWord.previousSibling.lastChild, "incorrect");
      removeClass(currentWord.previousSibling.lastChild, "correct");
    }
    if (currentLetter && !isFirstLetter) {
      removeClass(currentLetter, "current");
      addClass(currentLetter.previousSibling, "current");
      removeClass(currentLetter.previousSibling, "incorrect");
      removeClass(currentLetter.previousSibling, "correct");
    }
    if (!currentLetter) {
      addClass(currentWord.lastChild, "current");
      removeClass(currentWord.lastChild, "incorrect");
      removeClass(currentWord.lastChild, "correct");
    }
  }

  if (currentWord.getBoundingClientRect().top > 250) {
    const margin = parseInt(text.style.marginTop || "0px");
    text.style.scrollTop = margin - 35 + "px";
  }
  setCursor();
}

function setCursor() {
  const nextLetter = document.querySelector(".letter.current");
  const nextWord = document.querySelector(".word.current");
  const cursor = document.getElementById("cursor");
  cursor.style.top =
    (nextLetter || nextWord).getBoundingClientRect().top + 2 + "px";
  cursor.style.left =
    (nextLetter || nextWord).getBoundingClientRect()[
      nextLetter ? "left" : "right"
    ] + "px";
}

function newTest() {
  startTime = 0;
  clearInterval(timer);
  generateText();
}

currentText = [];

function restart() {
  startTime = 0;
  clearInterval(timer);
  setText(currentText);
  document.querySelector("#timer").innerHTML = `${duration}`;
}

function getWpm() {
  const lastTypedWord = document.querySelector(".word.current");
  const words = [...document.querySelectorAll(".word")];
  const lastTypedWordIndex = words.indexOf(lastTypedWord) + 1;
  const typedWords = words.slice(0, lastTypedWordIndex);
  const correctWords = typedWords.filter((word) => {
    const letters = [...word.children];
    const incorrectLetters = letters.filter((letter) =>
      letter.className.includes("incorrect")
    );
    const correctLetters = letters.filter((letter) =>
      letter.className.includes("correct")
    );
    return (
      incorrectLetters.length === 0 && correctLetters.length === letters.length
    );
  });

  let acc = (correctWords.length * 100) / typedWords.length;
  acc = Number.parseInt(acc);

  document.querySelector("#accuracy h2").innerHTML = `${acc}%`;
  document.querySelector("#speed h2").innerHTML = `${
    (correctWords.length / duration) * 60
  }`;
  document.querySelector("#raw h2").innerHTML = `${
    (typedWords.length / duration) * 60
  }`;
  document.querySelector("#errors h2").innerHTML = `${
    typedWords.length - correctWords.length
  }`;

  $("#myModal").modal("show");
  $("#myModal").on("hidden.bs.modal", function (e) {
    window.location.reload();
  });
}
