package api

import (
	"database/sql"
	"net/http"
	"time"

	"lablib/config"
	"lablib/middleware"
	"lablib/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *gin.Context) {
	var loginReq models.LoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := config.DB.QueryRow(`
		SELECT id, student_id, name, password, role, created_at, updated_at
		FROM users
		WHERE student_id = $1
	`, loginReq.StudentID).Scan(
		&user.ID, &user.StudentID, &user.Name, &user.Password,
		&user.Role, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginReq.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.String(),
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	userResponse := models.UserResponse{
		ID:        user.ID,
		StudentID: user.StudentID,
		Name:      user.Name,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: tokenString,
		User:  userResponse,
	})
}

func CreateDefaultUsers() error {
	// 一般ユーザーの作成
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Dependable61204"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = config.DB.Exec(`
		INSERT INTO users (id, student_id, name, password, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (student_id) DO NOTHING
	`,
		uuid.New(), "00061204", "一般さん", string(hashedPassword),
		"user", time.Now(), time.Now(),
	)
	if err != nil {
		return err
	}

	// 管理者ユーザーの作成
	_, err = config.DB.Exec(`
		INSERT INTO users (id, student_id, name, password, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (student_id) DO NOTHING
	`,
		uuid.New(), "00999999", "管理者さん", string(hashedPassword),
		"admin", time.Now(), time.Now(),
	)
	if err != nil {
		return err
	}

	return nil
}

func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
	user.Role = "user" // 一般ユーザーとして登録
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
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
