// General function to close whichever form is open
function closeForm() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'none';
}

// Function to validate ISBN
function isValidISBN(isbn) {
    // Remove any hyphens
    isbn = isbn.replace(/-/g, '');

    // Check if the ISBN is 10 or 13 characters long
    if (isbn.length === 10) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            if (isbn[i] < '0' || isbn[i] > '9') return false; // Ensure all characters are digits
            sum += (i + 1) * parseInt(isbn[i], 10);
        }

        let checksum = isbn[9];
        if (checksum === 'X') {
            sum += 10 * 10;
        } else if (checksum >= '0' && checksum <= '9') {
            sum += 10 * parseInt(checksum, 10);
        } else {
            return false;
        }
        return sum % 11 === 0;
    } else if (isbn.length === 13) {
        let sum = 0;
        for (let i = 0; i < 13; i++) {
            const digit = parseInt(isbn[i], 10);
            if (isNaN(digit)) return false; // Ensure all characters are digits
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        return sum % 10 === 0;
    }
    return false;
}


// Function to open the update form with current book details
async function editBook(bookId) {
    if (!bookId) {
        alert('Invalid book ID.');
        return;
    }

    try {
        // Fetch the book details from the server using the book ID
        const response = await fetch(`http://localhost:5500/books/${bookId}`);

        if (response.ok) {
            const book = await response.json();

            // Set the form fields with current book details
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editIsbn').value = book.isbn;
            document.getElementById('editGenre').value = book.genre;
            document.getElementById('editCopies').value = book.availableCopies;
            document.getElementById('editBookId').value = book._id;
            document.getElementById('editImage').value = ''; // Reset image input

            // Set the image preview element if there's an existing image
            const imageElement = document.getElementById('editBookPreviewImage');
            if (book.image) {
                imageElement.src = `data:image/jpeg;base64,${book.image}`;
                imageElement.style.display = 'block'; // Show the image if it exists
            } else {
                imageElement.style.display = 'none'; // Hide the image if not available
            }

            // Display the form
            document.getElementById('editFormContainer').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
        } else {
            alert('Failed to fetch book details for editing.');
        }
    } catch (error) {
        console.error('Error fetching book for editing:', error);
        alert('An error occurred while fetching the book details.');
    }
}

// Event listener to handle image preview when a new image is selected
document.getElementById('editImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageElement = document.getElementById('editBookPreviewImage');
            imageElement.src = e.target.result;
            imageElement.style.display = 'block'; // Show the preview
        };
        reader.readAsDataURL(file);
    }
});

// Function to handle update form submission
document.getElementById('editBookForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const isbn = document.getElementById('editIsbn').value;
    if (!isValidISBN(isbn)) {
        alert('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
        return;
    }

    const form = new FormData(this);
    const bookId = document.getElementById('editBookId').value;

    try {
        const response = await fetch(`http://localhost:5500/updateBook/${bookId}`, {
            method: 'PUT',
            body: form,
        });

        if (response.ok) {
            alert('Book updated successfully!');
            closeForm(); // Close the edit form
            getBooks(); // Refresh the book list
        } else {
            alert('Failed to update book. Please try again later.');
        }
    } catch (error) {
        console.error('Error updating book:', error);
        alert('An error occurred while updating the book. Please check the console for details.');
    }
});