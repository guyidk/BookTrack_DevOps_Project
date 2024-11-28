function closeForm() {
    document.getElementById('edit-overlay').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'none';
}

async function isTitleUnique(newTitle, bookId) {
    const response = await fetch(`http://localhost:5500/books`);
    const books = await response.json();

    return books.every(book => book.title !== newTitle || book._id === bookId);
}

function isValidISBN(isbn) {

    isbn = isbn.replace(/-/g, '');

    if (isbn.length === 10) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            if (isbn[i] < '0' || isbn[i] > '9') return false;
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
            if (isNaN(digit)) return false; 
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        return sum % 10 === 0;
    }
    return false;
}

async function editBook(bookId) {
    if (!bookId) {
        alert('Invalid book ID.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5500/books/${bookId}`);

        if (response.ok) {
            const book = await response.json();

            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editIsbn').value = book.isbn;
            document.getElementById('editGenre').value = book.genre;
            document.getElementById('editCopies').value = book.availableCopies;
            document.getElementById('editBookId').value = book._id;
            document.getElementById('editImage').value = ''; 

            
            const imageElement = document.getElementById('editBookPreviewImage');
            if (book.image) {
                imageElement.src = `data:image/jpeg;base64,${book.image}`;
                imageElement.style.display = 'block'; 
                imageElement.style.display = 'none'; 
            }

            
            document.getElementById('editFormContainer').style.display = 'block';
            document.getElementById('edit-overlay').style.display = 'block';
        } else {
            alert('Failed to fetch book details for editing.');
        }
    } catch (error) {
        console.error('Error fetching book for editing:', error);
        alert('An error occurred while fetching the book details.');
    }
}

document.getElementById('editImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    
    if (file) {
        
        if (file.size > 16 * 1024 * 1024) {
            alert('Image size should not exceed 16MB. Please select a smaller file.');
            event.target.value = ''; 
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageElement = document.getElementById('editBookPreviewImage');
            imageElement.src = e.target.result;
            imageElement.style.display = 'block'; 
        };
        reader.readAsDataURL(file);
    }
});


document.getElementById('editBookForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const form = new FormData(this);
    const bookId = document.getElementById('editBookId').value;
    const title = document.getElementById('editTitle').value.trim(); 
    const author = document.getElementById('editAuthor').value.trim();
    const isbn = document.getElementById('editIsbn').value;

   
    if (title.length > 100) {
        alert('Title must be 100 characters or fewer.');
        return;
    }

    if (author.length > 150) {
        alert('Author name must be 150 characters or fewer.');
        return;
    }

    if (!isValidISBN(isbn)) {
        alert('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
        return;
    }

    const isUniqueTitle = await isTitleUnique(title, bookId);
    if (!isUniqueTitle) {
        alert('Title already exists. Please choose a different title.');
        return;
    }

    const isConfirmed = confirm("Are you sure you want to update the book details?");
    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5500/updateBook/${bookId}`, {
            method: 'PUT',
            body: form,
        });

        if (response.ok) {
            alert('Book updated successfully!');
            closeForm(); 
            getBooks(); 
        } else {
            alert('Failed to update book. Please try again later.');
        }
    } catch (error) {
        console.error('Error updating book:', error);
        alert('An error occurred while updating the book. Please check the console for details.');
    }
});


function getBookById(bookId) {
    
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
        alert('Invalid book ID. Please provide a valid ID.');
        return; 
    }

    const request = new XMLHttpRequest();
    
    request.open('GET', `http://localhost:5500/books/${bookId}`, true);


    request.onload = function () {

        if (request.status >= 200 && request.status < 300) {
            
            const book = JSON.parse(request.responseText);
            displayBookDetails(book); 
        } else if (request.status === 404) {
            alert('Book not found. It may have been removed.');
            console.error('Book not found:', request.statusText);
        }else {
            alert('Failed to retrieve book details. Please try again later.');
            console.error('Failed to fetch book:', request.statusText);
        }
    };

    request.onerror = function () {
        
        console.error('Network error while fetching book');
        alert('An error occurred while fetching the book. Please check the console for details.');
    };

   
    request.send();
}