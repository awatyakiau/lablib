package api

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"lablib/config"
	"lablib/models"
)

func GetBooks(c *gin.Context) {
	query := c.Query("query")
	rows, err := config.DB.Query(`
		SELECT id, title, author, isbn, jan, ean13, type, total_copies, created_at, updated_at
		FROM books
		WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1 OR jan ILIKE $1 OR ean13 ILIKE $1
		ORDER BY title
	`, "%"+query+"%")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var book models.Book
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN,
			&book.JAN, &book.EAN13, &book.Type, &book.TotalCopies,
			&book.CreatedAt, &book.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning books"})
			return
		}
		books = append(books, book)
	}

	c.JSON(http.StatusOK, books)
}

func GetBookDetails(c *gin.Context) {
	bookID := c.Param("id")
	var book models.Book
	err := config.DB.QueryRow(`
		SELECT id, title, author, isbn, jan, ean13, type, total_copies, created_at, updated_at
		FROM books
		WHERE id = $1
	`, bookID).Scan(
		&book.ID, &book.Title, &book.Author, &book.ISBN,
		&book.JAN, &book.EAN13, &book.Type, &book.TotalCopies,
		&book.CreatedAt, &book.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 貸出履歴の取得
	rows, err := config.DB.Query(`
		SELECT br.id, br.user_id, br.book_copy_id, br.borrowed_at, br.due_date, br.returned_at, br.status,
			   u.name as user_name, bc.serial_number
		FROM borrow_records br
		JOIN users u ON br.user_id = u.id
		JOIN book_copies bc ON br.book_copy_id = bc.id
		WHERE bc.book_id = $1
		ORDER BY br.borrowed_at DESC
	`, bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching borrow history"})
		return
	}
	defer rows.Close()

	var borrowHistory []models.BorrowRecord
	for rows.Next() {
		var record models.BorrowRecord
		err := rows.Scan(
			&record.ID, &record.UserID, &record.BookCopyID,
			&record.BorrowedAt, &record.DueDate, &record.ReturnedAt,
			&record.Status, &record.User.Name, &record.BookCopy.SerialNumber,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning borrow history"})
			return
		}
		borrowHistory = append(borrowHistory, record)
	}

	c.JSON(http.StatusOK, gin.H{
		"book":           book,
		"borrow_history": borrowHistory,
	})
}

func BorrowBook(c *gin.Context) {
	userID, _ := c.Get("user_id")
	bookCopyID := c.PostForm("book_copy_id")

	// 書籍コピーの存在確認と貸出可能確認
	var isAvailable bool
	err := config.DB.QueryRow(`
		SELECT is_available
		FROM book_copies
		WHERE id = $1
	`, bookCopyID).Scan(&isAvailable)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book copy not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if !isAvailable {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Book is not available"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}
	defer tx.Rollback()

	// 貸出記録の作成
	borrowID := uuid.New()
	borrowedAt := time.Now()
	dueDate := borrowedAt.Add(14 * 24 * time.Hour) // 2週間後

	_, err = tx.Exec(`
		INSERT INTO borrow_records (id, user_id, book_copy_id, borrowed_at, due_date, status)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, borrowID, userID, bookCopyID, borrowedAt, dueDate, "borrowed")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating borrow record"})
		return
	}

	// 書籍コピーの状態を更新
	_, err = tx.Exec(`
		UPDATE book_copies
		SET is_available = false
		WHERE id = $1
	`, bookCopyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating book copy status"})
		return
	}

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Book borrowed successfully",
		"due_date": dueDate,
	})
}

func ReturnBook(c *gin.Context) {
	userID, _ := c.Get("user_id")
	bookCopyID := c.PostForm("book_copy_id")

	// 貸出記録の存在確認
	var borrowRecord models.BorrowRecord
	err := config.DB.QueryRow(`
		SELECT id, user_id, book_copy_id, borrowed_at, due_date, returned_at, status
		FROM borrow_records
		WHERE book_copy_id = $1 AND user_id = $2 AND status = 'borrowed'
	`, bookCopyID, userID).Scan(
		&borrowRecord.ID, &borrowRecord.UserID, &borrowRecord.BookCopyID,
		&borrowRecord.BorrowedAt, &borrowRecord.DueDate, &borrowRecord.ReturnedAt,
		&borrowRecord.Status,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Borrow record not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}
	defer tx.Rollback()

	// 返却日時の更新
	returnedAt := time.Now()
	_, err = tx.Exec(`
		UPDATE borrow_records
		SET returned_at = $1, status = 'returned'
		WHERE id = $2
	`, returnedAt, borrowRecord.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating borrow record"})
		return
	}

	// 書籍コピーの状態を更新
	_, err = tx.Exec(`
		UPDATE book_copies
		SET is_available = true
		WHERE id = $1
	`, bookCopyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating book copy status"})
		return
	}

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Book returned successfully",
		"returned_at": returnedAt,
	})
}

func GetBorrowHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var query string
	var args []interface{}

	if role == "admin" {
		query = `
			SELECT br.id, br.user_id, br.book_copy_id, br.borrowed_at, br.due_date, br.returned_at, br.status,
				   b.title, b.author, bc.serial_number, u.name as user_name
			FROM borrow_records br
			JOIN book_copies bc ON br.book_copy_id = bc.id
			JOIN books b ON bc.book_id = b.id
			JOIN users u ON br.user_id = u.id
			ORDER BY br.borrowed_at DESC
		`
	} else {
		query = `
			SELECT br.id, br.user_id, br.book_copy_id, br.borrowed_at, br.due_date, br.returned_at, br.status,
				   b.title, b.author, bc.serial_number
			FROM borrow_records br
			JOIN book_copies bc ON br.book_copy_id = bc.id
			JOIN books b ON bc.book_id = b.id
			WHERE br.user_id = $1
			ORDER BY br.borrowed_at DESC
		`
		args = append(args, userID)
	}

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching borrow history"})
		return
	}
	defer rows.Close()

	var history []models.BorrowRecord
	for rows.Next() {
		var record models.BorrowRecord
		err := rows.Scan(
			&record.ID, &record.UserID, &record.BookCopyID,
			&record.BorrowedAt, &record.DueDate, &record.ReturnedAt,
			&record.Status, &record.Book.Title, &record.Book.Author,
			&record.BookCopy.SerialNumber, &record.User.Name,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning borrow history"})
			return
		}
		history = append(history, record)
	}

	c.JSON(http.StatusOK, history)
} 