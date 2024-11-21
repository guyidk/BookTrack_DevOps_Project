// Import the functions to test
const { updateBook, fetchBookById } = require('../utils/update-book-util');

// Import supertest to test HTTP requests
const supertest = require('supertest');
// Import Express app
const { app } = require('../index');
// Mock the Book model
jest.mock('../models/book.js');

// Import the mocked Book model
const Book = require('../models/book.js');

const mongoose = require('mongoose'); // Ensure mongoose is imported in your test file

jest.mock('mongoose', () => {
    const originalMongoose = jest.requireActual('mongoose');
    return {
        ...originalMongoose,
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
    };
});

// Test cases
describe('Update Book Utility', () => {
    let request; // Holds the supertest instance for HTTP tests

    beforeAll(() => {
        request = supertest(app);
        jest.spyOn(console, 'log').mockImplementation(() => { }); // Silence logs
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    afterAll(async () => {
        jest.restoreAllMocks(); // Restore original implementations after each test
        await mongoose.disconnect(); // Properly disconnect the MongoDB connection
    });

    describe('updateBook', () => {

        it('should return 400 if uploaded image exceeds 16MB', async () => {
            const largeBuffer = Buffer.alloc(16 * 1024 * 1024 + 1);
            Book.findById.mockResolvedValue({ _id: '123456', title: 'Existing Book' }); // Mock book
            const res = await request.put('/updateBook/123456')
                .attach('file', largeBuffer, 'largeImage.jpg')
                .field('title', 'Valid Title')
                .field('author', 'Valid Author')
                .field('isbn', '123456789')
                .field('genre', 'Fiction')
                .field('availableCopies', 10);
        
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Image size should not exceed 16MB.');
        });
        
        it('should return 400 if uploaded file size is 0 bytes', async () => {
            const emptyBuffer = Buffer.alloc(0);
            Book.findById.mockResolvedValue({ _id: '123456', title: 'Existing Book' }); // Mock book
            const res = await request.put('/updateBook/123456')
                .attach('file', emptyBuffer, 'emptyImage.jpg')
                .field('title', 'Valid Title')
                .field('author', 'Valid Author')
                .field('isbn', '123456789')
                .field('genre', 'Fiction')
                .field('availableCopies', 10);
        
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Uploaded file is invalid.');
        });

        it('should return 400 if title exceeds 100 characters', async () => {
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'a'.repeat(101),
                    author: 'Author Name',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Title must be 100 characters or fewer.');
        });

        it('should return 400 if author exceeds 150 characters', async () => {
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'a'.repeat(151),
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Author name must be 150 characters or fewer.');
        });

        it('should return 400 if availableCopies is less than 0', async () => {
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: -1
                });
        
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Available copies should be more that 0');
        });
        
        it('should return 404 if the book does not exist', async () => {
            Book.findById.mockResolvedValue(null); // Simulate book not found
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Book not found');
        });

        it('should return 200 and update the book successfully', async () => {
            Book.findById.mockResolvedValue({ _id: '123456', title: 'Old Title' }); // Simulate existing book
            Book.findByIdAndUpdate.mockResolvedValue({
                _id: '123456',
                title: 'New Title',
                author: 'New Author'
            }); // Simulate updated book

            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'New Title',
                    author: 'New Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Book updated successfully!');
            expect(res.body.book.title).toBe('New Title');
        });

        it('should return 400 if title already exists', async () => {
            Book.findOne.mockResolvedValue({ _id: '7890127', title: 'Duplicate Title' }); // Simulate duplicate title
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'Duplicate Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });
        
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Title already exists.');
        });
        
        it('should log error and return 500 if an error occurs during book update', async () => {
            // Simulate an error being thrown by Book.findById
            Book.findById.mockRejectedValue(new Error('Database error'));
        
            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        
            // Make the request
            const res = await request.put('/updateBook/123456')
                .send({
                    title: 'Valid Title',
                    author: 'Valid Author',
                    isbn: '123456789',
                    genre: 'Fiction',
                    availableCopies: 10
                });
        
            // Assertions
            expect(res.status).toBe(500); // Ensure 500 status code is returned
            expect(res.body.error).toBe('An error occurred while updating the book.'); // Check error message in response
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating book:', expect.any(Error)); // Verify console.error is called with the right arguments
        
            // Restore the console.error mock
            consoleErrorSpy.mockRestore();
        });     

    });

    describe('fetchBookById', () => {
        it('should return 400 for invalid ObjectId', async () => {
            const res = await request.get('/books/invalid-id');
            expect(res.status).toBe(400);
            expect(res.text).toBe('Invalid book ID format');
        });

        it('should return 404 if the book is not found', async () => {
            Book.findById.mockResolvedValue(null); // Simulate no book found
            const res = await request.get('/books/5f8f2c8b6a9d1e2b3c7b8f9a');
            expect(res.status).toBe(404);
            expect(res.text).toBe('Book not found');
        });

        it('should return 200 and fetch the book successfully', async () => {
            Book.findById.mockResolvedValue({
                _id: '671c94d0607a452e0bc99e54',
            });

            const res = await request.get('/books/671c94d0607a452e0bc99e54');
            expect(res.status).toBe(200);
        });

        it('should log error and return 500 if an error occurs while fetching the book', async () => {
            // Simulate an error being thrown by Book.findById
            Book.findById.mockRejectedValue(new Error('Database error'));
        
            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        
            // Make the request
            const res = await request.get('/books/5f8f2c8b6a9d1e2b3c7b8f9a');
        
            // Assertions
            expect(res.status).toBe(500); // Ensure 500 status code is returned
            expect(res.text).toBe('Server error'); // Check error message in response
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching book by ID:', expect.any(Error)); // Verify console.error is called with the right arguments
        
            // Restore the console.error mock
            consoleErrorSpy.mockRestore();
        });

    });
});
