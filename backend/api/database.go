package api

import (
	"database/sql"
	"lablib/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// テーブル一覧取得
func GetTableNames(c *gin.Context) {
	db := config.DB
	rows, err := db.Query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			tables = append(tables, name)
		}
	}
	c.JSON(http.StatusOK, tables)
}

// テーブル内容取得
func GetTableData(c *gin.Context) {
	table := c.Param("table")
	db := config.DB
	rows, err := db.Query("SELECT * FROM " + table)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	columns, _ := rows.Columns()
	result := []map[string]interface{}{}
	for rows.Next() {
		columnsVals := make([]interface{}, len(columns))
		columnsPtrs := make([]interface{}, len(columns))
		for i := range columnsVals {
			columnsPtrs[i] = &columnsVals[i]
		}
		rows.Scan(columnsPtrs...)
		rowMap := map[string]interface{}{}
		for i, col := range columns {
			val := columnsPtrs[i].(*interface{})
			rowMap[col] = *val
		}
		result = append(result, rowMap)
	}
	c.JSON(http.StatusOK, gin.H{
		"tableName": table,
		"columns":   columns,
		"rows":      result,
	})
}

func GetDB() *sql.DB {
	return config.DB
}

func InitDB() {
	config.InitDB()
}
