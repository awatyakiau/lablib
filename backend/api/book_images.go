package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"lablib/config"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	BookImagesDir     = "./public/images/books"
	MaxImageSize      = 5 << 20 //5MB
	AllowedImageTypes = "image/jpeg,image/png,image/webp"
)

// GetBookImage - 書籍画像の取得(全ユーザー共通)
func GetBookImage(c *gin.Context) {
	bookID := c.Param("id")

	var imagePath string
	err := config.DB.QueryRow("SELECT image_path FROM books WHERE id = $1", bookID).Scan(&imagePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if imagePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	fullPath := filepath.Join(BookImagesDir, imagePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image file not found"})
		return
	}

	c.File(fullPath)
}

// UploadBookImage - 書籍画像のアップロード(管理者のみ)
func UploadBookImage(c *gin.Context) {
	bookID := c.Param("id")

	var exists bool
	err := config.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM books WHERE id = $1)", bookID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "画像ファイルが見つかりません"})
		return
	}
	defer file.Close()

	if header.Size > MaxImageSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ファイルサイズが大きすぎます（最大5MB）"})
		return
	}

	contentType := header.Header.Get("Content-Type")
	if !strings.Contains(AllowedImageTypes, contentType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "サポートされていない画像形式です"})
		return
	}

	if err := os.MkdirAll(BookImagesDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ディレクトリ作成に失敗しました"})
		return
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		switch contentType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		}
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	imagePath := filepath.Join(BookImagesDir, filename)

	// 既存画像の削除
	var oldImagePath string
	err = config.DB.QueryRow("SELECT image_path FROM books WHERE id = $1", bookID).Scan(&oldImagePath)
	if err == nil && oldImagePath != "" {
		oldFullPath := filepath.Join(BookImagesDir, oldImagePath)
		os.Remove(oldFullPath)
	}

	dst, err := os.Create(imagePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ファイル保存に失敗しました"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ファイル保存に失敗しました"})
		return
	}

	_, err = config.DB.Exec("UPDATE books SET image_path = $1, updated_at = NOW() WHERE id = $2", filename, bookID)
	if err != nil {
		os.Remove(imagePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベース更新に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "画像をアップロードしました",
		"image_path": filename,
	})
}

// DeleteBookImage - 書籍画像の削除（管理者のみ）
func DeleteBookImage(c *gin.Context) {
	bookID := c.Param("id")

	var imagePath string
	err := config.DB.QueryRow("SELECT image_path FROM books WHERE id = $1", bookID).Scan(&imagePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if imagePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "No image to delete"})
		return
	}

	fullPath := filepath.Join(BookImagesDir, imagePath)
	os.Remove(fullPath)

	_, err = config.DB.Exec("UPDATE books SET image_path = NULL, updated_at = NOW() WHERE id = $1", bookID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "画像を削除しました"})
}
