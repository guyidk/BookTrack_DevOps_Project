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

  it('should display an error for invalid ISBN(word)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('Invalid ISBN'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
  });

  it('should display an error for invalid ISBN(number <10)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('123'); // Invalid ISBN
    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.');
    });
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

  it('should display an error for invalid ISBN(number =10)', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editTitle').clear().type('Some Title');
    cy.get('#editAuthor').clear().type('Some Author');
    cy.get('#editIsbn').clear().type('1234567891'); // Invalid ISBN
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

  it('should update book details successfully', () => {
    cy.visit(baseUrl);
    // Ensure that the resource we just added is visible in the table
    // Step 1: Ensure books are loaded
    cy.get('#loading').should('not.be.visible'); // Wait until loading indicator disappears
    cy.get('.book-card').should('exist'); // Verify that at least one book is displayed

    cy.get('.book-card').first().within(() => {
      cy.get('input#editBtn').click();
    });

    cy.get('#editFormContainer').should('be.visible');
    cy.get('#editTitle').should('be.visible');

    const newTitle = 'Updated Book Title';
    const newAuthor = 'Updated Author';
    const newIsbn = '978-3-16-148410-0';
    const newGenre = 'Fiction';
    const newCopies = 5;

    cy.get('#editTitle').clear().type(newTitle);
    cy.get('#editAuthor').clear().type(newAuthor);
    cy.get('#editIsbn').clear().type(newIsbn);
    cy.get('#editGenre').select(newGenre);
    cy.get('#editCopies').clear().type(newCopies);

    cy.get('#editBookForm').submit();

    cy.on('window:alert', (text) => {
      expect(text).to.contains('Book updated successfully!');
    });
    cy.get('#editFormContainer').should('not.be.visible');

    cy.get('.book-card').first().within(() => {
      cy.contains(newTitle).should('exist');
      cy.contains(newAuthor).should('exist');
    });
  });

});