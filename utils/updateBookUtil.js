// Import the Book model to interact with the database
const Book = require('../models/Books');

// Define an asynchronous function to handle updating a book by ID
async function updateBook(req, res) {
    try {
        // Extract the book ID from the URL parameters
        const { id } = req.params;

        // Destructure the updated book details from the request body
        const { title, author, isbn, genre, availableCopies } = req.body;

        // Handle image update if a new image is provided
        let imageBase64;
        if (req.file) {
            imageBase64 = req.file.buffer.toString('base64');
        }

        // Find the book by ID and update it with new details
        const updatedBook = await Book.findByIdAndUpdate(id, {
            title,
            author,
            isbn,
            genre,
            availableCopies,
            ...(req.file && { image: imageBase64 }), // Update image if a new one is uploaded
        }, { new: true }); // Return the updated book document

        if (updatedBook) {
            res.status(200).json({ message: 'Book updated successfully!', book: updatedBook });
        } else {
            res.status(404).json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'An error occurred while updating the book.' });
    }
}

module.exports = { updateBook }; // Export the updateBook function to be used in index.js
