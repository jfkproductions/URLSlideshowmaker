let urls = []; // Array to store URL data
let isSlideshowRunning = false; // Track whether the slideshow is running
let slideshowTimeout = null; // Store the timeout for the slideshow

// Load data from localStorage when the application starts
window.addEventListener('DOMContentLoaded', () => {
    const storedData = localStorage.getItem('urls');
    if (storedData) {
        urls = JSON.parse(storedData); // Parse the saved data
        updateTable(); // Populate the table with stored data
    }
});

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('urls', JSON.stringify(urls));
}

// Add a new URL to the list
document.getElementById('addButton').addEventListener('click', () => {
    const nameInput = document.getElementById('nameInput');
    const urlInput = document.getElementById('urlInput');
    const errorMessage = document.getElementById('errorMessage');

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    // Validate input fields
    if (!name || !url || !isValidURL(url)) {
        errorMessage.textContent = 'Please enter a valid name and URL!';
        return;
    }

    // Clear error message after successful validation
    errorMessage.textContent = '';

    // Add to the URLs array (default duration is 10 seconds)
    urls.push({ name, url, duration: 10 });

    // Save to localStorage
    saveToLocalStorage();

    // Clear input fields
    nameInput.value = '';
    urlInput.value = '';

    // Update the table
    updateTable();
});

// Validate URL format
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Update the table with the current URLs
function updateTable() {
    const tableBody = document.getElementById('urlTableBody');
    tableBody.innerHTML = '';

    urls.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.url}</td>
            <td>
                <input type="number" value="${item.duration}" min="1" 
                    onchange="updateDuration(${index}, this.value)" 
                    style="width: 100%; text-align: center;">
            </td>
            <td class="action-buttons">
                <button onclick="editURL(${index})" title="Edit">🖉</button>
                <button onclick="deleteURL(${index})" title="Delete">❌</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update duration in the array when changed
function updateDuration(index, newDuration) {
    newDuration = parseInt(newDuration);
    if (isNaN(newDuration) || newDuration < 1) {
        alert('Duration must be a positive number.');
        return;
    }
    urls[index].duration = newDuration;
    saveToLocalStorage();
}

// Delete a URL from the list
function deleteURL(index) {
    urls.splice(index, 1); // Remove the URL from the array
    saveToLocalStorage(); // Save updated data to localStorage
    updateTable(); // Refresh the table
}

// Edit an existing URL in the list
function editURL(index) {
    const row = document.querySelectorAll('#urlTableBody tr')[index];
    const nameCell = row.children[0];
    const urlCell = row.children[1];
    const actionCell = row.children[3];

    // Save current values
    const currentName = nameCell.textContent;
    const currentURL = urlCell.textContent;

    // Replace table cells with input fields for editing
    nameCell.innerHTML = `<input type="text" value="${currentName}" id="editName${index}" style="width: 100%;">`;
    urlCell.innerHTML = `<input type="text" value="${currentURL}" id="editURL${index}" style="width: 100%;">`;
    actionCell.innerHTML = `
        <button onclick="saveEdit(${index})" title="Save">✔️</button>
        <button onclick="cancelEdit(${index}, '${currentName}', '${currentURL}')" title="Cancel">✖️</button>
    `;
}

// Save changes made during editing
function saveEdit(index) {
    const nameInput = document.getElementById(`editName${index}`);
    const urlInput = document.getElementById(`editURL${index}`);
    const errorMessage = document.getElementById('errorMessage');

    const newName = nameInput.value.trim();
    const newURL = urlInput.value.trim();

    // Validate the edited input
    if (!newName || !newURL || !isValidURL(newURL)) {
        errorMessage.textContent = 'Please enter a valid name and URL!';
        return;
    }

    // Clear error message after successful validation
    errorMessage.textContent = '';

    // Update the URL data in the array
    urls[index] = { name: newName, url: newURL, duration: urls[index].duration };

    // Save updated data to localStorage
    saveToLocalStorage();

    // Refresh the table
    updateTable();
}

// Cancel editing and restore original values
function cancelEdit(index, originalName, originalURL) {
    const row = document.querySelectorAll('#urlTableBody tr')[index];
    const nameCell = row.children[0];
    const urlCell = row.children[1];
    const actionCell = row.children[3];

    // Restore original values
    nameCell.textContent = originalName;
    urlCell.textContent = originalURL;
    actionCell.innerHTML = `
        <button onclick="editURL(${index})" title="Edit">🖉</button>
        <button onclick="deleteURL(${index})" title="Delete">❌</button>
    `;
}

// Start or Stop the slideshow
document.getElementById('startButton').addEventListener('click', () => {
    const errorMessage = document.getElementById('errorMessage');
    const startButton = document.getElementById('startButton');

    if (isSlideshowRunning) {
        // Stop the slideshow
        clearTimeout(slideshowTimeout); // Clear the timeout
        window.electron.send('stop-slideshow'); // Notify main process to close slideshow window
        isSlideshowRunning = false;
        startButton.textContent = 'Start Slideshow'; // Update button text
        errorMessage.textContent = ''; // Clear any previous messages
    } else {
        // Validate URLs
        if (urls.length === 0) {
            errorMessage.textContent = 'Please add at least one URL to start the slideshow!';
            return;
        }

        // Clear error message after successful validation
        errorMessage.textContent = '';

        // Send the list of URLs with durations to the main process
        window.electron.send('start-slideshow', { urls });

        // Update UI state
        isSlideshowRunning = true;
        startButton.textContent = 'Stop Slideshow'; // Update button text
    }
});
