// Import the Book model to interact with the database
const Book = require('../models/Books.js');
const BorrowTransaction = require('../models/BorrowTransaction')
// Define an asynchronous function to handle adding a new book
async function addBook(req, res) {
    try {
        // Destructure the required book details from the request body
        const { title, author, isbn, genre, availableCopies } = req.body;

        // Convert the uploaded file buffer to a Base64 encoded string for the image
        const imageBase64 = req.file.buffer.toString('base64');

        // Create a new instance of the Book model with the provided data
        const newBook = new Book({
            title,
            author,
            isbn,
            genre,
            availableCopies,
            image: imageBase64,
        });

        await newBook.save(); // Save the new book instance to the database

        res.status(201).json({ message: 'Book added successfully!' });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'An error occurred while adding the book.' });
    }
}

async function addTransaction(req, res) {
    const { book_id, borrower_name, borrowDate, returnDate } = req.body;

    // Validate book ID
    const book = await Book.findById(book_id);
    if (!book) {
        return res.status(400).json({ error: "Invalid book ID" });
    }

    // Validate borrower name
    if (!borrower_name) {
        return res.status(400).json({ error: "Borrower name is required" });
    }

    // Validate dates
    const borrowDateObj = new Date(borrowDate);
    const returnDateObj = new Date(returnDate);

    if (isNaN(borrowDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
        return res.status(400).json({ error: "Invalid date format for borrowDate or returnDate" });
    }

    // Create new transaction
    const newTransaction = new BorrowTransaction({
        book_id: book._id, // Link to the book by its ID
        borrower: { name: borrower_name },
        borrowDate: borrowDateObj,
        returnDate: returnDateObj,
    });

    try {
        await newTransaction.save();
        res.json({ message: "Transaction added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error saving transaction: " + error.message });
    }
}

module.exports = { addBook ,addTransaction }; // Export the addBook function to make it available in other parts of the application
