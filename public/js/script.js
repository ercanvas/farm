let buttonRow = document.querySelector('.button-row');
let vegButtonRow = document.querySelector('.vegbutton-row');
let grid = document.querySelector('.field-container');
let vegCountTable = document.createElement('table');
vegCountTable.style.marginTop = '20px'; // Style the table a bit

let buttonlist = ['🌱', '🔨', '👨‍🌾'];
let veglist = ['🥦', '🥬', '🥕', '🍆', '🥒', '🧅', '🥔'];

// Initialize an empty 4x4 grid
let gridState = Array(4).fill().map(() => Array(4).fill(null)); // 4x4 grid with empty slots

// Object to keep track of vegetable counts
let vegSelections = {
    '🥦': 0,
    '🥬': 0,
    '🥕': 0,
    '🍆': 0,
    '🥒': 0,
    '🧅': 0,
    '🥔': 0
};

let selectedField = null;
let timers = []; // Store timers for each field
let timerExpired = Array(4).fill().map(() => Array(4).fill(false)); // Track if timers expired for each field

// Create buttons for each vegetable type
function createButton(buttonlist) {
    for (let i = 0; i < buttonlist.length; i++) {
        let button = document.createElement('button');
        button.innerHTML = buttonlist[i];
        button.id = 'btn_' + i;
        button.addEventListener('click', () => {
            // Show vegetable selection buttons when clicking on the first button (🌱)
            if (button.id === 'btn_0') {
                showVegButtons(); // Show the veg buttons on the screen
            }
        });
        buttonRow.appendChild(button);
    }
}

// Show vegetable buttons when user clicks the first button
function showVegButtons() {
    vegButtonRow.innerHTML = ''; // Clear previous buttons if any

    // Create buttons for each vegetable
    for (let i = 0; i < veglist.length; i++) {
        let vegbutton = document.createElement('button');
        vegbutton.innerHTML = veglist[i];
        vegbutton.id = 'veg_' + i;

        // When a vegetable is clicked, add it to the field
        vegbutton.addEventListener('click', (event) => {
            let selectedVeg = event.target.innerHTML;
            console.log(`Selected vegetable: ${selectedVeg}`);
            placeVegInField(selectedVeg); // Call to place vegetable in field
        });

        vegButtonRow.appendChild(vegbutton);
    }
}

// Function to handle when a field is clicked
function handleFieldClick(event) {
    let field = event.target;

    // Check if the field is already occupied or the timer has expired
    if (gridState[field.dataset.row][field.dataset.col] !== null || timerExpired[field.dataset.row][field.dataset.col]) {
        return; // Don't allow placement if field is occupied or timer expired
    }

    // Show vegetable selection buttons
    showVegButtons();
    // Save the field in which the vegetable will be placed
    selectedField = field;
}

// Place the selected vegetable in the field
function placeVegInField(vegetable) {
    // Check if the selected field is empty before placing the vegetable
    if (selectedField && gridState[selectedField.dataset.row][selectedField.dataset.col] === null) {
        selectedField.innerHTML = vegetable;
        gridState[selectedField.dataset.row][selectedField.dataset.col] = vegetable; // Update grid state
        console.log(`Placed ${vegetable} in position (${selectedField.dataset.row}, ${selectedField.dataset.col})`);

        // Start the individual timer for this vegetable placement on this field
        startTimer(selectedField.dataset.row, selectedField.dataset.col, vegetable);
    }
}

// Start the individual timer for a specific field
function startTimer(row, col, vegetable) {
    let remainingTime = 30; // Start with 30 seconds
    const field = document.querySelector(`.field[data-row="${row}"][data-col="${col}"]`);
    let timerElement = document.createElement('div');
    timerElement.classList.add('timer');
    field.appendChild(timerElement);

    // Display the remaining time
    timerElement.innerHTML = `${remainingTime} sec`;
    timers.push(setInterval(() => {
        remainingTime--;
        timerElement.innerHTML = `${remainingTime} sec`;

        if (remainingTime <= 0) {
            clearInterval(timers[timers.length - 1]); // Stop this timer
            timerExpired[row][col] = true; // Mark this field as expired
            timerElement.remove(); // Remove the timer display from the field
            enableCollection(row, col, vegetable); // Enable collection when timer finishes
        }
    }, 1000)); // Update every second
}

// Enable collection of vegetable when the timer finishes
function enableCollection(row, col, vegetable) {
    const field = document.querySelector(`.field[data-row="${row}"][data-col="${col}"]`);
    field.style.backgroundColor = '#90EE90'; // Change background to show it's collectable
    field.setAttribute('title', 'Click to collect!'); // Add a tooltip for collection

    // Allow collection only when the timer has expired
    field.addEventListener('click', function collect() {
        if (timerExpired[row][col]) {
            // Increment the vegetable count and update the table
            vegSelections[vegetable]++;
            updateVegCountTable(); // Update the vegetable count table

            // Empty the field after collection
            field.innerHTML = '';
            gridState[row][col] = null; // Reset the field state
            field.style.backgroundColor = ''; // Reset background to white
            field.removeEventListener('click', collect); // Remove collection listener

            // Stop further increase of count (prevent additional collection)
            timerExpired[row][col] = false;
        }
    });
}

// Update the vegetable count table after each placement
function updateVegCountTable() {
    let rows = vegCountTable.rows;
    for (let i = 1; i < rows.length; i++) {
        let veg = rows[i].cells[0].innerHTML;
        let countCell = rows[i].cells[1];
        countCell.innerHTML = vegSelections[veg]; // Update the count for each vegetable
    }
}

// Create the vegetable count table
function createVegCountTable() {
    // Add headers
    let headerRow = vegCountTable.insertRow();
    let vegHeader = headerRow.insertCell();
    vegHeader.innerHTML = 'Vegetable';
    let countHeader = headerRow.insertCell();
    countHeader.innerHTML = 'Count';

    // Add vegetable counts
    for (let veg in vegSelections) {
        let row = vegCountTable.insertRow();
        let vegCell = row.insertCell();
        vegCell.innerHTML = veg;
        let countCell = row.insertCell();
        countCell.innerHTML = vegSelections[veg];
    }

    vegCountTable.style.width = '200px'; // Make the table smaller
    document.body.appendChild(vegCountTable);
}

// Create the grid with 4x4 fields
function createGrid() {
    if (!grid) {
        console.error('Grid element not found!');
        return;
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let field = document.createElement('div');
            field.className = 'field';
            field.dataset.row = i;
            field.dataset.col = j;
            field.addEventListener('click', handleFieldClick);
            grid.appendChild(field);
        }
    }
}

// Initialize everything
createGrid();
createButton(buttonlist);
createVegCountTable();
