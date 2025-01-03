
$(document).ready(function () {
    const filePath = 'js/words.txt';

    const currentKeyDisplay = $("#currentKeyDisplay")
    const typingBox = $("#typingBox");
    const elapsedTimeDisplay = $("#elapsedTime");
    const wordCountDisplay = $("#wordCount");
    const wordsPerMinuteDisplay = $("#wordsPerMinuteDisplay");

    let words = [];
    let currentWordIndex = 0;
    let CurrentCharacterIndex = 0;
    let started = false;
    let incorrectTimeout = null;
    let timer = null;
    let startTime = null;

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
                    const randomWords = shuffleArray(words).slice(0, 200);
                    resolve(randomWords);
                })
                .catch(error => {
                    console.error(error);
                    reject(error)
                });
        });
    };

    const renderText = () => {
        const html = words.map((word, wordIndex) => {
            // Already completed
            if (wordIndex < currentWordIndex) {
                return `<span class="correct">${word}</span>`;
            }
            // Current Word
            if (wordIndex === currentWordIndex) {
                const chars = word.split("").map((char, charIndex) => {
                    if (charIndex < CurrentCharacterIndex) {
                        return `<span class="correct">${char}</span>`;
                    }
                    if (charIndex === CurrentCharacterIndex) {
                        return `<span class="highlight">${char}</span>`;
                    }
                    return char;
                });
                return chars.join("");
            }
            return word;
        }).join(" ");

        typingBox.html(html);
    }

    document.addEventListener('keypress', (event) => {
        const newText = event.key === " " ? "␣" : event.key;
        currentKeyDisplay.text(newText);

        let currentWord = words[currentWordIndex];
        let currentChar = currentWord[CurrentCharacterIndex];

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
            CurrentCharacterIndex++;

            if (CurrentCharacterIndex === currentWord.length) {
                console.log("Completed word!")
                CurrentCharacterIndex = 0;
                currentWordIndex++;
            }

            if (currentWordIndex === words.length) {
                // Finished!
            }
        }
        else {
            // Wrong character
            console.log(`Wrong character wanted ${currentChar} got ${event.key}`);

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

    const startTimer = () => {
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
        }, 1000)

    }

    // Actual doing stuff...  
    loadWords()
        .then(fetchedWords => {
            words = fetchedWords;
            renderText();
        })
        .catch(error => {
            console.error("Error loading words:", error);
            // TODO Add some error message?
        }
    );
})

