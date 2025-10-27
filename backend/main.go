package main

import (
	"log"

	"lablib/api"
	"lablib/config"

	"github.com/gin-gonic/gin"
)

func main() {
	// データベースの初期化
	config.InitDB()

	// デフォルトユーザーの作成
	if err := api.CreateDefaultUsers(); err != nil {
		log.Fatal("Error creating default users:", err)
	}

	// Ginルーターの初期化
	r := gin.Default()

	// CORSミドルウェアの設定
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 認証ルート
	r.POST("/api/auth/login", api.Login)
	r.POST("/api/auth/register", api.Register)

	// 認証が必要なルート
	auth := r.Group("/api")
	//auth.Use(middleware.AuthMiddleware())
	{
		// 図書管理
		auth.GET("/books", api.GetBooks)
		auth.GET("/books/fetch-info", api.FetchBookInfo)
		auth.GET("/books/:id", api.GetBookDetails)
		auth.GET("/books/:id/image", api.GetBookImage)
		auth.GET("/books/borrow-record/:id", api.GetBorrowRecordDetails)
		auth.POST("/books/borrow", api.BorrowBook)
		auth.POST("/books/return", api.ReturnBook)
		auth.GET("/books/history", api.GetBorrowHistory)

		// 管理者専用ルート
		admin := auth.Group("/admin")
		//admin.Use(middleware.AdminMiddleware())
		{
			admin.POST("/books", api.CreateBook)
			admin.PUT("/books/:id", api.UpdateBook)
			admin.DELETE("/books/:id", api.DeleteBook)
			admin.POST("/users", api.CreateUser)
			admin.DELETE("/users/:id", api.DeleteUser)
			admin.GET("/users", api.GetUsers)
			admin.GET("/rankings", api.GetMonthlyRankings)

			// バーコード生成機能
			admin.POST("/barcode/generate-thesis", api.GenerateThesisBarcode)
			admin.GET("/barcode/saved", api.GetSavedBarcodes)
			admin.GET("/barcode/download/:filename", api.DownloadBarcodeImage)
			admin.DELETE("/barcode/:filename", api.DeleteBarcodeImage)

			// 書籍画像管理機能（追加）
			admin.POST("/books/:id/image", api.UploadBookImage)
			admin.DELETE("/books/:id/image", api.DeleteBookImage)
		}
	}

	// サーバーの起動
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
