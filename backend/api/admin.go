package api

import (
	"net/http"
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
		INSERT INTO books (id, title, author, isbn, jan, ean13, type, total_copies, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		book.ID, book.Title, book.Author, book.ISBN,
		book.JAN, book.EAN13, book.Type, book.TotalCopies,
		book.CreatedAt, book.UpdatedAt,
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
			INSERT INTO book_copies (id, book_id, serial_number, is_available, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`,
			copyID, book.ID, serialNumber, true,
			time.Now(), time.Now(),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating book copies"})
			return
		}
	}

	// 管理者ログの記録
	adminID, _ := c.Get("user_id")
	_, err = tx.Exec(`
		INSERT INTO admin_logs (id, admin_id, action, target_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`,
		uuid.New(), adminID, "create_book", book.ID, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
		return
	}

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, book)
}

func DeleteBook(c *gin.Context) {
	bookID := c.PostForm("book_id")

	// トランザクション開始
	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start transaction"})
		return
	}
	defer tx.Rollback()

	// 書籍の削除
	_, err = tx.Exec("DELETE FROM books WHERE id = $1", bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting book"})
		return
	}

	// 管理者ログの記録
	adminID, _ := c.Get("user_id")
	_, err = tx.Exec(`
		INSERT INTO admin_logs (id, admin_id, action, target_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`,
		uuid.New(), adminID, "delete_book", bookID, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
		return
	}

	// トランザクションのコミット
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error committing transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
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
	adminID, _ := c.Get("user_id")
	_, err = tx.Exec(`
		INSERT INTO admin_logs (id, admin_id, action, target_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`,
		uuid.New(), adminID, "create_user", user.ID, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
		return
	}

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
	userID := c.PostForm("user_id")

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
	adminID, _ := c.Get("user_id")
	_, err = tx.Exec(`
		INSERT INTO admin_logs (id, admin_id, action, target_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`,
		uuid.New(), adminID, "delete_user", userID, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating admin log"})
		return
	}

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

	var rankings []models.MonthlyRanking
	for rows.Next() {
		var ranking models.MonthlyRanking
		err := rows.Scan(
			&ranking.ID, &ranking.Month, &ranking.BookID,
			&ranking.BorrowCount, &ranking.Book.Title,
			&ranking.Book.Author, &ranking.Book.Type,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning monthly rankings"})
			return
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
