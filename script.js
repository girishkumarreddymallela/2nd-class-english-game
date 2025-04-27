document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const endScreen = document.getElementById('end-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const scoreDisplay = document.getElementById('score');
    const finalScoreDisplay = document.getElementById('final-score');
    const monsterImage = document.getElementById('monster-image');
    const itemImage = document.getElementById('item-image');
    const pictureDisplay = document.getElementById('picture-display');
    const wordOptionsContainer = document.getElementById('word-options');
    const dropZone = document.getElementById('drop-zone');
    const feedbackDisplay = document.getElementById('feedback');
    const instructionText = document.getElementById('instruction');

    // --- Game Data ---
    // Add more words and corresponding image paths
    const wordsData = [
        { word: 'apple', image: 'images/apple.png' },
        { word: 'ball', image: 'images/ball.png' },
        { word: 'cat', image: 'images/cat.png' },
        { word: 'dog', image: 'images/dog.png' },
        { word: 'sun', image: 'images/sun.png' },
        { word: 'tree', image: 'images/tree.png' },
        { word: 'car', image: 'images/car.png' },
        { word: 'book', image: 'images/book.png' },
        { word: 'fish', image: 'images/fish.png' },
        { word: 'star', image: 'images/star.png' },
        // Add more... make sure you have images in an 'images' folder
    ];

    let currentWordIndex = 0;
    let score = 0;
    let shuffledWords = [];
    let incorrectChoicesCount = 2; // How many wrong words to show (adjust difficulty)
    let currentCorrectWord = '';
    let dragTimeout; // To prevent accidental immediate re-drag after wrong answer

    // --- Game Functions ---

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    function startGame() {
        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        score = 0;
        currentWordIndex = 0;
        updateScore();
        shuffledWords = shuffleArray([...wordsData]); // Shuffle a copy
        instructionText.textContent = "Drag the right word here!"; // Reset instruction
        loadNextWord();
    }

    function endGame() {
        finalScoreDisplay.textContent = score;
        endScreen.classList.remove('hidden');
       
    }

    function updateScore() {
        scoreDisplay.textContent = score;
    }

    function loadNextWord() {
        clearTimeout(dragTimeout); // Clear any pending timeouts
        feedbackDisplay.classList.remove('visible', 'correct', 'incorrect'); // Hide feedback
        monsterImage.src = 'images/monster_idle.png'; // Reset monster state
        monsterImage.classList.remove('bounce-animation', 'shake-animation'); // Remove result animations

        if (currentWordIndex >= shuffledWords.length) {
            endGame();
            return;
        }

        const currentWordData = shuffledWords[currentWordIndex];
        currentCorrectWord = currentWordData.word;

        // Display the picture
        itemImage.src = currentWordData.image;
        itemImage.alt = `Image of a ${currentCorrectWord}`;
        pictureDisplay.style.opacity = '0'; // Fade effect prep
        setTimeout(() => { pictureDisplay.style.opacity = '1'; }, 100); // Start fade in

        // Prepare word options
        wordOptionsContainer.innerHTML = ''; // Clear previous options
        const options = generateWordOptions(currentCorrectWord);

        // Display word options with animation stagger
        options.forEach((word, index) => {
            const wordElement = document.createElement('div');
            wordElement.classList.add('word-option');
            wordElement.textContent = word;
            wordElement.draggable = true;
            wordElement.dataset.word = word; // Store word in data attribute
            wordElement.style.setProperty('--i', index); // For CSS animation delay
            wordElement.addEventListener('dragstart', handleDragStart);
            wordOptionsContainer.appendChild(wordElement);
        });
    }

    function generateWordOptions(correctWord) {
        const options = [correctWord];
        const wrongWords = wordsData
            .map(item => item.word)
            .filter(word => word !== correctWord); // Get all other words

        // Shuffle wrong words and pick required number
        shuffleArray(wrongWords);
        for (let i = 0; i < incorrectChoicesCount && i < wrongWords.length; i++) {
            options.push(wrongWords[i]);
        }

        return shuffleArray(options); // Shuffle the final options (correct + incorrect)
    }

    function showFeedback(isCorrect) {
        feedbackDisplay.classList.remove('correct', 'incorrect'); // Clear previous classes
        feedbackDisplay.textContent = isCorrect ? 'Yummy! Correct!' : 'Oops! Try Again!';
        feedbackDisplay.classList.add(isCorrect ? 'correct' : 'incorrect');
        feedbackDisplay.classList.add('visible');

        // Monster animation
        monsterImage.classList.remove('bounce-animation', 'shake-animation'); // Reset first
        void monsterImage.offsetWidth; // Trigger reflow to restart animation
        monsterImage.classList.add(isCorrect ? 'bounce-animation' : 'shake-animation');
      

        // Hide feedback after a delay if incorrect
        if (!isCorrect) {
            setTimeout(() => {
                feedbackDisplay.classList.remove('visible');
                monsterImage.src = 'images/monster_idle.png'; // Reset if wrong
                 monsterImage.classList.remove('shake-animation');
            }, 1500);
        }
    }

    // --- Drag and Drop Event Handlers ---

    function handleDragStart(e) {
        // Set the data being dragged (the word text)
        e.dataTransfer.setData('text/plain', e.target.dataset.word);
        e.dataTransfer.effectAllowed = 'move';
        // Optional: slightly fade the dragged element
        setTimeout(() => e.target.style.opacity = '0.5', 0);
        instructionText.textContent = "Feed me that word!"; // Change instruction while dragging
    }

    // Need listeners on the drop zone
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        dropZone.classList.add('drag-over'); // Visual feedback
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over'); // Remove visual feedback
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default drop behavior (like opening link)
        dropZone.classList.remove('drag-over');
        instructionText.textContent = "Drag the right word here!"; // Reset instruction

        const droppedWord = e.dataTransfer.getData('text/plain');
        const isCorrect = (droppedWord === currentCorrectWord);

        // Restore opacity of all word options (in case drag was cancelled)
        document.querySelectorAll('.word-option').forEach(el => el.style.opacity = '1');

        showFeedback(isCorrect);

        if (isCorrect) {
            score += 10;
            updateScore();
            triggerConfetti(); // Fun effect!
            currentWordIndex++;
            // Add a slight delay before loading the next word
            setTimeout(loadNextWord, 1200); // Wait for feedback/animation
        } else {
             score -= 2; // Small penalty (optional)
             if(score < 0) score = 0; // Don't go below zero
             updateScore();
             // Temporarily disable dragging after incorrect answer to prevent spamming
             wordOptionsContainer.style.pointerEvents = 'none';
             dragTimeout = setTimeout(() => {
                 wordOptionsContainer.style.pointerEvents = 'auto';
             }, 1000); // Re-enable after 1 second
        }
    });

    // Restore opacity if drag ends elsewhere
    document.addEventListener('dragend', (e) => {
         if (e.target.classList.contains('word-option')) {
            e.target.style.opacity = '1'; // Restore original opacity
         }
         instructionText.textContent = "Drag the right word here!"; // Reset instruction
         dropZone.classList.remove('drag-over'); // Ensure hover state is removed
    });


    // --- Confetti Function ---
    function triggerConfetti() {
        // Use the canvas-confetti library
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 } // Start confetti from around the middle
        });
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    // --- Initial Setup ---
    // Show start screen initially (handled by CSS 'visible' class)

}); // End DOMContentLoaded
