package api

import (
	"database/sql"
	"net/http"
	"time"

	"lablib/config"
	"lablib/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetBooks(c *gin.Context) {
	query := c.Query("query")
	rows, err := config.DB.Query(`
        SELECT
            b.id, b.title, b.author, b.isbn, b.jan, b.ean13, b.type, b.total_copies,
            b.barcode, b.location, b.created_at, b.updated_at,
            COUNT(bc.id) FILTER (WHERE bc.is_available = true) AS available_copies
        FROM books b
        LEFT JOIN book_copies bc ON bc.book_id = b.id
        WHERE b.title ILIKE $1 OR b.author ILIKE $1 OR b.isbn ILIKE $1 OR b.jan ILIKE $1 OR b.ean13 ILIKE $1
        GROUP BY b.id
        ORDER BY b.title
    `, "%"+query+"%")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var books []map[string]interface{}
	for rows.Next() {
		var book models.Book
		var barcode, location sql.NullString
		var availableCopies int
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.ISBN,
			&book.JAN, &book.EAN13, &book.Type, &book.TotalCopies,
			&barcode, &location, &book.CreatedAt, &book.UpdatedAt, &availableCopies,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning books"})
			return
		}
		books = append(books, map[string]interface{}{
			"id":           book.ID,
			"title":        book.Title,
			"author":       book.Author,
			"isbn":         book.ISBN,
			"jan":          book.JAN,
			"ean13":        book.EAN13,
			"type":         book.Type,
			"total_copies": book.TotalCopies,
			"barcode":      barcode.String,
			"location":     location.String,
			"created_at":   book.CreatedAt,
			"updated_at":   book.UpdatedAt,
			"available":    availableCopies > 0,
		})
	}

	c.JSON(http.StatusOK, books)
}

func GetBookDetails(c *gin.Context) {
	bookID := c.Param("id")
	var book models.Book
	var barcode, location sql.NullString
	err := config.DB.QueryRow(`
        SELECT id, title, author, isbn, jan, ean13, type, total_copies, barcode, location, created_at, updated_at
        FROM books
        WHERE id = $1
    `, bookID).Scan(
		&book.ID, &book.Title, &book.Author, &book.ISBN,
		&book.JAN, &book.EAN13, &book.Type, &book.TotalCopies,
		&barcode, &location, &book.CreatedAt, &book.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// 貸出可否・貸出中情報を取得
	var availableCopies int
	var borrowedBy, borrowedAt, dueDate sql.NullString
	err = config.DB.QueryRow(`
        SELECT
            COUNT(*) FILTER (WHERE is_available = true) AS available_copies
        FROM book_copies
        WHERE book_id = $1
    `, bookID).Scan(&availableCopies)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching availability"})
		return
	}

	// もし貸出中のコピーがあれば、その情報も取得（最初の1件だけ例示）
	err = config.DB.QueryRow(`
        SELECT br.user_id::text, br.borrowed_at::text, br.due_date::text
        FROM borrow_records br
        JOIN book_copies bc ON br.book_copy_id = bc.id
        WHERE bc.book_id = $1 AND br.status = 'borrowed'
        ORDER BY br.borrowed_at DESC
        LIMIT 1
    `, bookID).Scan(&borrowedBy, &borrowedAt, &dueDate)
	// エラーは無視（貸出中がない場合もある））

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

	var borrowHistory []map[string]interface{}
	for rows.Next() {
		var (
			idStr, userIDStr, bookCopyIDStr string
			borrowedAt, dueDate             time.Time
			returnedAt                      sql.NullTime
			status, userName, serialNumber  string
		)
		err := rows.Scan(
			&idStr, &userIDStr, &bookCopyIDStr,
			&borrowedAt, &dueDate, &returnedAt, &status,
			&userName, &serialNumber,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning borrow history"})
			return
		}
		borrowHistory = append(borrowHistory, map[string]interface{}{
			"id":         idStr,
			"userId":     userIDStr,
			"userName":   userName,
			"borrowedAt": borrowedAt,
			"dueDate":    dueDate,
			"returnedAt": func() *time.Time {
				if returnedAt.Valid {
					return &returnedAt.Time
				}
				return nil
			}(),
			"status": status,
		})
	}

	// レスポンスを組み立て
	bookMap := map[string]interface{}{
		"id":           book.ID,
		"title":        book.Title,
		"author":       book.Author,
		"isbn":         book.ISBN,
		"jan":          book.JAN,
		"ean13":        book.EAN13,
		"type":         book.Type,
		"total_copies": book.TotalCopies,
		"barcode":      barcode.String,
		"location":     location.String,
		"created_at":   book.CreatedAt,
		"updated_at":   book.UpdatedAt,
		"available":    availableCopies > 0,
	}
	if borrowedBy.Valid {
		bookMap["borrowedBy"] = borrowedBy.String
	}
	if borrowedAt.Valid {
		bookMap["borrowedAt"] = borrowedAt.String
	}
	if dueDate.Valid {
		bookMap["dueDate"] = dueDate.String
	}

	// ...書籍情報の組み立て...
	c.JSON(http.StatusOK, gin.H{
		"book":           bookMap,
		"borrow_history": borrowHistory,
	})
}

func BorrowBook(c *gin.Context) {
	// JSONからバーコードとユーザーIDを受け取る
	var req struct {
		Barcode string `json:"barcode"`
		UserID  string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが正しくありません"})
		return
	}
	barcode := req.Barcode
	userID := req.UserID

	if barcode == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "バーコードとユーザーIDは必須です"})
		return
	}

	// バーコードからbook_copy_idを取得
	var bookCopyID string
	err := config.DB.QueryRow(`
        SELECT id FROM book_copies WHERE barcode = $1 AND is_available = true LIMIT 1
    `, barcode).Scan(&bookCopyID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "貸出可能な書籍コピーが見つかりません"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクション開始失敗"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "貸出記録作成エラー"})
		return
	}

	// 書籍コピーの状態を更新
	_, err = tx.Exec(`
        UPDATE book_copies SET is_available = false WHERE id = $1
    `, bookCopyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "書籍コピー状態更新エラー"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "コミットエラー"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "貸出成功",
		"due_date": dueDate,
	})
}

func ReturnBook(c *gin.Context) {
	// JSONからバーコードとユーザーIDを受け取る
	var req struct {
		Barcode string `json:"barcode"`
		UserID  string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストデータが正しくありません"})
		return
	}
	barcode := req.Barcode
	userID := req.UserID

	if barcode == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "バーコードとユーザーIDは必須です"})
		return
	}

	// バーコードからbook_copy_idを取得
	var bookCopyID string
	err := config.DB.QueryRow(`
        SELECT id FROM book_copies WHERE barcode = $1 LIMIT 1
    `, barcode).Scan(&bookCopyID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "書籍コピーが見つかりません"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	// 貸出記録の存在確認
	var borrowRecordID string
	err = config.DB.QueryRow(`
        SELECT id FROM borrow_records
        WHERE book_copy_id = $1 AND user_id = $2 AND status = 'borrowed'
    `, bookCopyID, userID).Scan(&borrowRecordID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "貸出記録が見つかりません"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DBエラー"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクション開始失敗"})
		return
	}
	defer tx.Rollback()

	// 返却日時の更新
	returnedAt := time.Now()
	_, err = tx.Exec(`
        UPDATE borrow_records
        SET returned_at = $1, status = 'returned'
        WHERE id = $2
    `, returnedAt, borrowRecordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "返却記録更新エラー"})
		return
	}

	// 書籍コピーの状態を更新
	_, err = tx.Exec(`
        UPDATE book_copies SET is_available = true WHERE id = $1
    `, bookCopyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "書籍コピー状態更新エラー"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "コミットエラー"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "返却成功",
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
               b.title, b.author, bc.serial_number, u.name as user_name
        FROM borrow_records br
        JOIN book_copies bc ON br.book_copy_id = bc.id
        JOIN books b ON bc.book_id = b.id
        JOIN users u ON br.user_id = u.id
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

	var history []map[string]interface{}
	for rows.Next() {
		var (
			idStr, userIDStr, bookCopyIDStr string
			borrowedAt, dueDate             time.Time
			returnedAt                      sql.NullTime
			status, title, author           string
			serialNumber, userName          string
		)
		err := rows.Scan(
			&idStr, &userIDStr, &bookCopyIDStr,
			&borrowedAt, &dueDate, &returnedAt, &status,
			&title, &author, &serialNumber, &userName,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning borrow history"})
			return
		}
		history = append(history, map[string]interface{}{
			"id":         idStr,
			"userId":     userIDStr,
			"itemId":     bookCopyIDStr,
			"itemTitle":  title,
			"userName":   userName,
			"borrowedAt": borrowedAt,
			"dueDate":    dueDate,
			"returnedAt": func() *time.Time {
				if returnedAt.Valid {
					return &returnedAt.Time
				}
				return nil
			}(),
			"status": status,
		})
	}
	c.JSON(http.StatusOK, history)
}
