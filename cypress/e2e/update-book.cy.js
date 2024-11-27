describe('Update Book Frontend', () => {
  let baseUrl;
  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
      cy.visit(baseUrl);
    });
  });
  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });

  it('should display an alert if there is an error while fetching book details for editing', () => {
    // Intercept the GET request for fetching book details and force a network error
    cy.intercept('GET', '/books/*', {
      forceNetworkError: true,
    }).as('fetchBookDetailsError');
  
    // Visit the base URL
    cy.visit(baseUrl);
  
    // Attempt to open the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });
  
    // Wait for the intercepted request to fail
    cy.wait('@fetchBookDetailsError');
  
    // Validate the error handling with console logs and alerts
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.contains('An error occurred while fetching the book details.');
    });
  
    // Optionally, check if the console error message was logged
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
  
    // Ensure the console error was logged
    cy.get('@consoleError').should(
      'have.been.calledWith',
      'Error fetching book for editing:'
    );
  });

  it('should display an alert if book details fail to fetch for editing', () => {
    // Intercept the GET request for fetching book details with a failed response
    cy.intercept('GET', '/books/*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('fetchBookDetailsError');
  
    // Visit the base URL
    cy.visit(baseUrl);
  
    // Attempt to open the edit form for the first book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });
  
    // Wait for the intercepted request to be triggered
    cy.wait('@fetchBookDetailsError');
  
    // Verify the alert message
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Failed to fetch book details for editing.');
    });
  });

  it('should prevent updating book with a duplicate title', () => {
    cy.visit(baseUrl);

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Existing Book Title'); // Duplicate title
    cy.get('#editAuthor').clear().type('Updated Author');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Title already exists. Please choose a different title.');
    });
  });

  it('should prevent updating book with a title > 100', () => {
    cy.visit(baseUrl);

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('The Enchanted Forest: A Journey Through the Forgotten Realms, Where Magic Breathes and Legends Come to Life in Every Leaf and Branch, Waiting to Be Unfolded'); // Duplicate title
    cy.get('#editAuthor').clear().type('Updated Author');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Title must be 100 characters or fewer.');
    });
  });

  it('should prevent updating book with a author > 150', () => {
    cy.visit(baseUrl);

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('author check Title'); // Duplicate title
    cy.get('#editAuthor').clear().type('a'.repeat(151));
    cy.get('#editIsbn').clear().type('978-0062439591');
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Author name must be 150 characters or fewer.');
    });
  });

  it('should hide the image preview if the image is not available', () => {
    cy.visit(baseUrl);

    // Mock the book details API response to exclude the image
    cy.intercept('GET', '/books/*', {
      statusCode: 200,
      body: {
        _id: '123',
        title: 'Book Without Image',
        author: 'Author Name',
        isbn: '978-0451524935',
        genre: 'Fiction',
        availableCopies: 5,
        image: null, // No image provided
      },
    }).as('getBookDetails');

    // Trigger the edit form for a book
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Wait for the mocked API response
    cy.wait('@getBookDetails');

    // Verify that the image preview element is hidden
    cy.get('#editBookPreviewImage').should('not.be.visible');
  });

  it('should display an error for invalid ISBN(number >10)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('12345678910'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should display an error for invalid ISBN(number&letters =10)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567A89'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });


  it('should display an error for invalid ISBN(number =10)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567890'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should accept a valid ISBN-10 with X as checksum', () => {
    cy.visit(baseUrl);

    // Navigate to the edit form
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Input a valid ISBN-10 where the checksum is 'X'
    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('156881111X'); // Valid ISBN-10 with 'X' as checksum
    cy.get('#editBookForm').submit();

    // Ensure no alert is displayed
    cy.on('window:alert', (text) => {
      expect(text).not.to.contains('Invalid ISBN');
    });

    // Ensure the form submission was successful
    cy.get('.book-card').should('contain', '156881111X');
  });

  it('should display an error for an ISBN-10 with an invalid checksum character', () => {
    cy.visit(baseUrl);

    // Navigate to the edit form
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    // Input an invalid ISBN-10 with an invalid checksum character
    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('123456789Y'); // Invalid checksum character 'Y'
    cy.get('#editBookForm').submit();

    // Validate the error alert
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });


  it('should display an error for invalid ISBN(number&letters =13)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567A90123'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should handle server errors gracefully during update', () => {
    // Stub the PUT request to return a server error
    cy.intercept('PUT', '/updateBook/*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('updateBookError');

    cy.visit(baseUrl);

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('New Title');
    cy.get('#editBookForm').submit();

    cy.wait('@updateBookError');
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Failed to update book. Please try again later.');
    });
  });

  it('should display an error if the book title is not unique', () => {
    cy.visit(baseUrl);

    // Mock the API response for checking unique title
    cy.intercept('GET', '/books', {
      statusCode: 200,
      body: [
        { _id: '123', title: '1984', author: 'George Orwell', isbn: '978-0451524935' }
      ],
    }).as('fetchBooks');

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('1984');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('978-3-16-148410-0');
    cy.get('#editBookForm').submit();

    // Wait for the mocked API call to resolve
    cy.wait('@fetchBooks');

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Title already exists. Please choose a different title.');
    });
  });


  it('should successfully update a book with valid data', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('978-0590353427'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Book updated successfully!');
    });
  });

});