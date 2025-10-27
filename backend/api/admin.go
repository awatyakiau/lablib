package api

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"lablib/config"
	"lablib/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func CreateBook(c *gin.Context) {
	var book models.Book

	if err := c.ShouldBindJSON(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}
	defer tx.Rollback()

	// 書籍の作成
	book.ID = uuid.New()
	book.CreatedAt = time.Now()
	book.UpdatedAt = time.Now()

	_, err = tx.Exec(`
    INSERT INTO books (id, title, author, isbn, jan, ean13, type, total_copies, barcode, location, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`,
		book.ID, book.Title, book.Author, book.ISBN,
		book.JAN, book.EAN13, book.Type, book.TotalCopies,
		book.Barcode, book.Location, book.CreatedAt, book.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating book"})
		return
	}

	// 書籍コピーの作成
	for i := 0; i < book.TotalCopies; i++ {
		copyID := uuid.New()
		serialNumber := book.ID.String()[:8] + "-" + uuid.New().String()[:4]
		_, err = tx.Exec(`
        INSERT INTO book_copies (id, book_id, serial_number, barcode, is_available, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
			copyID, book.ID, serialNumber, book.Barcode, true,
			time.Now(), time.Now(),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating book copies"})
			return
		}
	}

	// 管理者ログの記録
	/*
		_, err = tx.Exec(`
			INSERT INTO admin_logs (id, action, target_id, created_at)
			VALUES ($1, $2, $3, $4, $5)
		`,
			uuid.New(), "create_book", book.ID, time.Now(),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
			return
		}*/

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, book)
}

// DeleteBook - 書籍削除(管理者のみ)
func DeleteBook(c *gin.Context) {
	bookID := c.Param("id")

	// UUIDの検証
	if _, err := uuid.Parse(bookID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		log.Printf("Transaction start error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// 書籍の存在確認
	var exists bool
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM books WHERE id = $1)", bookID).Scan(&exists)
	if err != nil {
		log.Printf("Book existence check error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// 貸出中の書籍があるか確認（テーブル名を borrow_records に修正）
	var borrowedCount int
	err = tx.QueryRow(`
        SELECT COUNT(*) 
        FROM borrow_records br
        JOIN book_copies bc ON br.book_copy_id = bc.id
        WHERE bc.book_id = $1 AND br.returned_at IS NULL
    `, bookID).Scan(&borrowedCount)

	if err != nil {
		log.Printf("Borrowed count check error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if borrowedCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "貸出中の書籍は削除できません"})
		return
	}

	// 画像ファイルの削除
	var imagePath sql.NullString
	err = tx.QueryRow("SELECT image_path FROM books WHERE id = $1", bookID).Scan(&imagePath)
	if err == nil && imagePath.Valid && imagePath.String != "" {
		fullPath := filepath.Join("./public/images/books", imagePath.String)
		if err := os.Remove(fullPath); err != nil {
			log.Printf("Image deletion warning: %v", err)
		}
	}

	// 返却済みの貸出履歴を削除（テーブル名を borrow_records に修正）
	_, err = tx.Exec(`
        DELETE FROM borrow_records 
        WHERE book_copy_id IN (
            SELECT id FROM book_copies WHERE book_id = $1
        ) AND returned_at IS NOT NULL
    `, bookID)
	if err != nil {
		log.Printf("Borrow records deletion error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete borrow records"})
		return
	}

	// 月間ランキングデータの削除
	_, err = tx.Exec("DELETE FROM monthly_rankings WHERE book_id = $1", bookID)
	if err != nil {
		log.Printf("Monthly rankings deletion warning: %v", err)
	}

	// book_copiesの削除
	_, err = tx.Exec("DELETE FROM book_copies WHERE book_id = $1", bookID)
	if err != nil {
		log.Printf("Book copies deletion error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book copies"})
		return
	}

	// 書籍本体の削除
	result, err := tx.Exec("DELETE FROM books WHERE id = $1", bookID)
	if err != nil {
		log.Printf("Book deletion error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// トランザクションコミット
	if err = tx.Commit(); err != nil {
		log.Printf("Transaction commit error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	log.Printf("Book deleted successfully: %s", bookID)
	c.JSON(http.StatusOK, gin.H{"message": "書籍を削除しました"})
}

func CreateUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// 学籍番号の重複チェック
	var exists bool
	err := config.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE student_id = $1)", user.StudentID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "この学籍番号は既に登録されています"})
		return
	}

	// パスワードのハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}
	defer tx.Rollback()

	// ユーザーの作成
	user.ID = uuid.New()
	user.Password = string(hashedPassword)
	user.Role = "user"
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err = tx.Exec(`
		INSERT INTO users (id, student_id, name, password, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		user.ID, user.StudentID, user.Name, user.Password,
		user.Role, user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user", "detail": err.Error()})
		return
	}

	// 管理者ログの記録
	/*
		_, err = tx.Exec(`
			INSERT INTO admin_logs (id, action, target_id, created_at)
			VALUES ($1, $2, $3, $4, $5)
		`,
			uuid.New(), "create_user", user.ID, time.Now(),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
			return
		}*/

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	// パスワードを除外してレスポンスを返す
	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	if userID == "" {
		c.JSON(400, gin.H{"error": "id is required"})
		return
	}

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}

	defer tx.Rollback()

	// ユーザーの削除
	_, err = tx.Exec("DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting user"})
		return
	}

	// 管理者ログの記録
	/*
		_, err = tx.Exec(`
			INSERT INTO admin_logs (id, action, target_id, created_at)
			VALUES ($1, $2, $3, $4, $5)
		`,
			uuid.New(), "delete_user", userID, time.Now(),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
			return
		}*/

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func GetMonthlyRankings(c *gin.Context) {
	month := c.Query("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	rows, err := config.DB.Query(`
        SELECT mr.id, mr.month, mr.book_id, mr.borrow_count,
               b.title, b.author, b.type
        FROM monthly_rankings mr
        JOIN books b ON mr.book_id = b.id
        WHERE mr.month = $1
        ORDER BY mr.borrow_count DESC
        LIMIT 10
    `, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching monthly rankings"})
		return
	}
	defer rows.Close()

	var rankings []map[string]interface{}
	for rows.Next() {
		var (
			id, month, bookID       string
			borrowCount             int
			title, author, bookType string
		)
		err := rows.Scan(&id, &month, &bookID, &borrowCount, &title, &author, &bookType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning monthly rankings"})
			return
		}

		ranking := map[string]interface{}{
			"id":           id,
			"month":        month,
			"book_id":      bookID,
			"borrow_count": borrowCount,
			"title":        title,
			"author":       author,
			"type":         bookType,
		}
		rankings = append(rankings, ranking)
	}

	c.JSON(http.StatusOK, rankings)
}

// ユーザー一覧取得
func GetUsers(c *gin.Context) {
	rows, err := config.DB.Query("SELECT id, student_id, name, role FROM users ORDER BY student_id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.StudentID, &user.Name, &user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning users"})
			return
		}
		users = append(users, user)
	}
	c.JSON(http.StatusOK, users)
}
