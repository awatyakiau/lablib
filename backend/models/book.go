package models

import (
	"time"

	"github.com/google/uuid"
)

type Book struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
	ISBN        *string   `json:"isbn,omitempty"`
	JAN         *string   `json:"jan,omitempty"`
	EAN13       *string   `json:"ean13,omitempty"`
	Type        string    `json:"type"`
	TotalCopies int       `json:"total_copies"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BookCopy struct {
	ID           uuid.UUID `json:"id"`
	BookID       uuid.UUID `json:"book_id"`
	SerialNumber string    `json:"serial_number"`
	IsAvailable  bool      `json:"is_available"`
	Location     *string   `json:"location,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type BorrowRecord struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	BookCopyID   uuid.UUID  `json:"book_copy_id"`
	BorrowedAt   time.Time  `json:"borrowed_at"`
	DueDate      time.Time  `json:"due_date"`
	ReturnedAt   *time.Time `json:"returned_at,omitempty"`
	Status       string     `json:"status"`
	Book         Book       `json:"book"`
	BookCopy     BookCopy   `json:"book_copy"`
	User         User       `json:"user"`
}

type AdminLog struct {
	ID        uuid.UUID  `json:"id"`
	AdminID   uuid.UUID  `json:"admin_id"`
	Action    string     `json:"action"`
	TargetID  *uuid.UUID `json:"target_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type MonthlyRanking struct {
	ID          uuid.UUID `json:"id"`
	Month       string    `json:"month"`
	BookID      uuid.UUID `json:"book_id"`
	BorrowCount int       `json:"borrow_count"`
	Book        Book      `json:"book"`
} 