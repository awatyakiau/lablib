package api

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/ean"
	"github.com/gin-gonic/gin"
	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
)

// バーコードファイル保存ディレクトリ
const BARCODE_DIR = "./public/barcodes"

// EAN13チェックデジット計算
func calculateEAN13CheckDigit(code string) int {
	if len(code) != 12 {
		return 0
	}

	oddSum := 0  // 奇数桁の合計
	evenSum := 0 // 偶数桁の合計

	for i, char := range code {
		digit, _ := strconv.Atoi(string(char))
		if (i+1)%2 == 1 { // 奇数桁
			oddSum += digit
		} else { // 偶数桁
			evenSum += digit
		}
	}

	// チェックデジット計算
	total := oddSum + evenSum*3
	checkDigit := (10 - (total % 10)) % 10
	return checkDigit
}

// 卒論用EAN13バーコード生成（6桁学籍番号対応）
func generateThesisBarcode(year string, studentID string) string {
	// 年度4桁 + 学籍番号6桁 + 予備00 = 12桁
	code12 := year + fmt.Sprintf("%06s", studentID) + "00" // 6桁で0埋め + 予備00

	// 12桁に調整
	if len(code12) > 12 {
		code12 = code12[:12]
	}

	// 12桁未満の場合は0で埋める
	for len(code12) < 12 {
		code12 = code12 + "0"
	}

	// チェックデジット計算
	checkDigit := calculateEAN13CheckDigit(code12)

	return code12 + strconv.Itoa(checkDigit)
}

// テキストを画像に描画する関数（プレーン形式のみ）
func drawTextCentered(img draw.Image, text string, width, yPos int, textColor color.Color) {
	// フォントサイズと文字間隔を調整
	fontFace := basicfont.Face7x13

	// テキストの幅を計算
	textWidth := len(text) * 7 // 基本フォントの文字幅

	// 中央揃えのX座標計算
	x := (width - textWidth) / 2
	if x < 0 {
		x = 5 // 最小マージン
	}

	point := fixed.Point26_6{
		X: fixed.Int26_6(x * 64),
		Y: fixed.Int26_6(yPos * 64),
	}

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(textColor),
		Face: fontFace,
		Dot:  point,
	}
	d.DrawString(text)
}

// バーコード番号付きの画像生成（プレーン形式のみ）
func generateBarcodeImageWithNumber(code string, width, height int) (image.Image, error) {
	// EAN13バーコード生成
	barcodeData, err := ean.Encode(code)
	if err != nil {
		return nil, fmt.Errorf("バーコード生成エラー: %v", err)
	}

	// テキスト領域の高さ（1行のみ）
	textAreaHeight := 25
	barcodeHeight := height - textAreaHeight

	// バーコード画像のサイズ調整
	barcodeImage, err := barcode.Scale(barcodeData, width, barcodeHeight)
	if err != nil {
		return nil, fmt.Errorf("画像サイズ調整エラー: %v", err)
	}

	// 新しい画像作成（バーコード + テキスト領域）
	finalImg := image.NewRGBA(image.Rect(0, 0, width, height))

	// 背景を白で塗りつぶし
	draw.Draw(finalImg, finalImg.Bounds(), &image.Uniform{color.RGBA{255, 255, 255, 255}}, image.Point{}, draw.Src)

	// バーコード画像を上部に描画
	barcodeRect := image.Rect(0, 0, width, barcodeHeight)
	draw.Draw(finalImg, barcodeRect, barcodeImage, image.Point{}, draw.Src)

	// バーコード番号をプレーン形式で表示（1行のみ）
	plainCode := code
	textY := barcodeHeight + 18
	drawTextCentered(finalImg, plainCode, width, textY, color.RGBA{0, 0, 0, 255})

	return finalImg, nil
}

// バーコード画像生成・保存
func createAndSaveBarcodeImage(code string, filename string) (string, error) {
	// ディレクトリ作成
	err := os.MkdirAll(BARCODE_DIR, 0755)
	if err != nil {
		return "", fmt.Errorf("ディレクトリ作成エラー: %v", err)
	}

	// バーコード番号付きの画像生成（高さを195pxに調整）
	finalImage, err := generateBarcodeImageWithNumber(code, 400, 195)
	if err != nil {
		return "", err
	}

	// ファイルパス生成
	filePath := filepath.Join(BARCODE_DIR, filename+".png")

	// PNG画像ファイル保存
	file, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("ファイル作成エラー: %v", err)
	}
	defer file.Close()

	err = png.Encode(file, finalImage)
	if err != nil {
		return "", fmt.Errorf("PNG エンコードエラー: %v", err)
	}

	return filePath, nil
}

// Base64画像データ生成（番号付き・プレーン形式のみ）
func generateBase64Image(code string) (string, error) {
	// バーコード番号付きの画像生成
	finalImage, err := generateBarcodeImageWithNumber(code, 400, 195)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, finalImage); err != nil {
		return "", err
	}

	base64String := base64.StdEncoding.EncodeToString(buf.Bytes())
	return "data:image/png;base64," + base64String, nil
}

// 卒論バーコード生成API（管理者専用）
func GenerateThesisBarcode(c *gin.Context) {
	var req struct {
		Year       string `json:"year" binding:"required"`        // 年度
		StudentID  string `json:"student_id" binding:"required"`  // 学籍番号
		AuthorName string `json:"author_name" binding:"required"` // 作者名
		Title      string `json:"title" binding:"required"`       // 論文タイトル
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "必須フィールドが不足しています"})
		return
	}

	// 学籍番号の検証（6桁）
	cleanStudentID := strings.ReplaceAll(req.StudentID, "-", "")
	cleanStudentID = strings.ReplaceAll(cleanStudentID, " ", "")

	if len(cleanStudentID) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "学籍番号は6桁で入力してください"})
		return
	}

	// 数字のみかチェック
	for _, char := range cleanStudentID {
		if char < '0' || char > '9' {
			c.JSON(http.StatusBadRequest, gin.H{"error": "学籍番号は数字のみで入力してください"})
			return
		}
	}

	// バーコード生成
	barcode := generateThesisBarcode(req.Year, cleanStudentID)

	// ファイル名生成（年度_学籍番号_タイムスタンプ）
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("thesis_%s_%s_%s", req.Year, cleanStudentID, timestamp)

	// バーコード画像保存（番号付き・プレーン形式）
	filePath, err := createAndSaveBarcodeImage(barcode, filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Base64画像データ生成（プレビュー用、番号付き・プレーン形式）
	base64Image, err := generateBase64Image(barcode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "プレビュー画像生成エラー"})
		return
	}

	// レスポンス
	response := map[string]interface{}{
		"barcode":     barcode,
		"year":        req.Year,
		"student_id":  cleanStudentID,
		"author_name": req.AuthorName,
		"title":       req.Title,
		"filename":    filename + ".png",
		"file_path":   filePath,
		"image_data":  base64Image,
		"created_at":  time.Now().Format("2006-01-02 15:04:05"),
		"status":      "生成完了（プレーン番号付き画像）",
	}

	c.JSON(http.StatusOK, response)
}

// 保存されたバーコード一覧取得API（管理者専用）
func GetSavedBarcodes(c *gin.Context) {
	files, err := ioutil.ReadDir(BARCODE_DIR)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ディレクトリ読み取りエラー"})
		return
	}

	var barcodes []map[string]interface{}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".png") {
			// ファイル名から情報抽出
			nameWithoutExt := strings.TrimSuffix(file.Name(), ".png")
			parts := strings.Split(nameWithoutExt, "_")

			barcode := map[string]interface{}{
				"filename":   file.Name(),
				"file_path":  filepath.Join(BARCODE_DIR, file.Name()),
				"created_at": file.ModTime().Format("2006-01-02 15:04:05"),
				"size":       file.Size(),
			}

			// ファイル名から年度と学籍番号を抽出
			if len(parts) >= 3 && parts[0] == "thesis" {
				barcode["year"] = parts[1]
				barcode["student_id"] = parts[2]
			}

			barcodes = append(barcodes, barcode)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"barcodes": barcodes,
		"count":    len(barcodes),
	})
}

// バーコード画像ダウンロードAPI（管理者専用）
func DownloadBarcodeImage(c *gin.Context) {
	filename := c.Param("filename")

	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ファイル名が必要です"})
		return
	}

	filePath := filepath.Join(BARCODE_DIR, filename)

	// ファイル存在チェック
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "ファイルが見つかりません"})
		return
	}

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/octet-stream")
	c.File(filePath)
}

// バーコード画像削除API（管理者専用）
func DeleteBarcodeImage(c *gin.Context) {
	filename := c.Param("filename")

	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ファイル名が必要です"})
		return
	}

	filePath := filepath.Join(BARCODE_DIR, filename)

	// ファイル存在チェック
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "ファイルが見つかりません"})
		return
	}

	// ファイル削除
	err := os.Remove(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ファイル削除エラー"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "ファイルが削除されました",
		"filename": filename,
	})
}
