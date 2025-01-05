"use strict";

$(document).ready(function () {
    const filePath = 'data/words.txt';

    const currentKeyDisplay = $("#currentKeyDisplay")
    const typingBox = $("#typingBox");
    const elapsedTimeDisplay = $("#elapsedTime");
    const wordCountDisplay = $("#wordCount");
    const wordsPerMinuteDisplay = $("#wordsPerMinuteDisplay");
    const wrongCharacterDisplay = $("#wrongCharacterDisplay");

    let started = false;
    let isComplete = false;
    let incorrectTimeout = null;
    let timer = null;
    let startTime = null;
    let wrongCharacters = 0;
    
    const maxCharactersPerRow = 64;
    const rows = [];

    let currentWordIndex = 0;
    let currentCharacterIndex = 0;
    let currentRowIndex = 0;



    function initializeRows(words) {
        rows.length = 0;
        let currentRow = { index: 0, words: [], characterCount: 0 };

        words.forEach(word => {
            // Get added space if there is a word infront of it
            const addedSpace = (currentRow.words.length > 0 ? 1 : 0)
            const wordLengthWithSpace = word.length + addedSpace;

            if (currentRow.characterCount + wordLengthWithSpace <= maxCharactersPerRow) {
                currentRow.words.push(word);
                currentRow.characterCount += wordLengthWithSpace;
            } else {
                rows.push(currentRow)
                currentRow = { index: rows.length, words: [word], characterCount: word.length }
            }
        });

        if (currentRow.words.length > 0) {
            rows.push(currentRow)
        }
    }

    function generateRowHtml(row) {
        
        const rowHtml = row.words.map((word, wordIndex) => {

            const absoluteWordIndex = calculateAbsoluteWordIndex(row.index, wordIndex);
            
            // completed
            if(row.index < currentRowIndex || absoluteWordIndex < currentWordIndex) {
                return generateWordHtml(word, false, 0);
            } 
            // current
            else if (row.index === currentRowIndex && absoluteWordIndex === currentWordIndex) {
                return generateWordHtml(word, true, currentCharacterIndex)
            } 
            // future
            else {
                return `<span class="future">${word}</span>`;
            }
        }).join(" ")

        return `<p class="row">${rowHtml}</p>`;
    }

    function calculateAbsoluteWordIndex(rowIndex, wordIndex) {
        const totalWordsInPreviousRows = rows.slice(0, rowIndex)
            .reduce((sum, row) => sum + row.words.length, 0);
        
            return totalWordsInPreviousRows + wordIndex;
    }

    function generateWordHtml(word, isCurrentWord, currentCharIndex) {
        // if not current word
        if (!isCurrentWord) {
            return `<span class="correct">${word}</span>`
        }

        // split into characters and deal with highlights on character basis then join back together
        return word.split("")
                .map((char, charIndex) => {
                    if (charIndex < currentCharIndex) {
                        return `<span class="correct">${char}</span>`;
                    } else if (charIndex === currentCharIndex) {
                        return `<span class="highlight">${char}</span>`;
                    } else {
                        return `<span class="future">${char}</span>`;
                    }
                }).join("");
    }

    function renderText() {
        rows.forEach((row) => {
            row.renderedHtml = generateRowHtml(row);
        })

        const html = rows.map((row) => row.renderedHtml).join("");

        typingBox.html(html);
    }

    /*  Fisher-Yates Shuffle */
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const loadWords = () => {
        return new Promise((resolve, reject) => {
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch file: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(data => {

                    const words = data.split("\r\n");
                    const randomWords = shuffleArray(words).slice(0, 15);
                    resolve(randomWords);
                })
                .catch(error => {
                    console.error(error);
                    reject(error)
                });
        });
    };

    document.addEventListener('keypress', (event) => {
        if (isComplete) {
            return;
        }

        const newText = event.key === " " ? "␣" : event.key;
        currentKeyDisplay.text(newText);

        let currentRow = rows[currentRowIndex];
        let currentWord = currentRow.words[currentWordIndex - calculateAbsoluteWordIndex(currentRowIndex, 0)]
        let currentChar = currentWord[currentCharacterIndex];

        if (event.key === " ") {
            return;
        }

        if (event.key === currentChar) {
            if (!started) {
                startTimer();
            }
            // Clear any incorrect highlight timeout
            if (incorrectTimeout) {
                clearTimeout(incorrectTimeout);
                incorrectTimeout = null;
            }
            currentCharacterIndex++;

            if (currentCharacterIndex === currentWord.length) {
                console.log("Completed word!")
                currentCharacterIndex = 0;
                currentWordIndex++;
            }
            if (currentWordIndex === calculateAbsoluteWordIndex(currentRowIndex + 1, 0)) {
                console.log("finished a row!!!")
                currentRowIndex++;

                if(currentRowIndex === rows.length) {
                    stopTimer();
                    isComplete = true;
                    alert("Finished!")
                }
            }

        }
        else {
            // Wrong character
            console.log(`Wrong character wanted ${currentChar} got ${event.key}`);

            wrongCharacters++;

            // Update highlighted character to be red
            const wrongHtml = `<span class="incorrect">${currentChar}</span>`;
            $(".highlight").replaceWith(wrongHtml)

            // Skip rendertext for 0.5s, to highlight the red text color. 
            incorrectTimeout = setTimeout(() => {
                renderText();
            }, 500);

            // Return so we skip renderText()
            return;
        }

        renderText();
    })

    function startTimer() {
        started = true;
        startTime = new Date();

        timer = setInterval(() => {

            const wordCount = currentWordIndex;

            // Display elapsed time
            const elapsedTime = Math.floor((new Date() - startTime) / 1000);
            elapsedTimeDisplay.text(elapsedTime);

            // Display finished words
            wordCountDisplay.text(wordCount);

            // Display Words Per Minute
            const calculatedWpm = Math.round((wordCount / elapsedTime) * 60);
            const wpmDisplay = startTime ? calculatedWpm : 0;
            wordsPerMinuteDisplay.text(wpmDisplay)

            // Display typos
            wrongCharacterDisplay.text(wrongCharacters);
        }, 1000)
    }

    function stopTimer() {
        if(!startTimer) {
            return;
        }

        clearInterval(timer);
        timer = null;
    }

    loadWords()
        .then(fetchedWords => {
            //words = fetchedWords;
            initializeRows(fetchedWords)
            renderText();
        })
        .catch(error => {
            console.error("Error loading words:", error);
            alert("Error loading words");
        });
})

