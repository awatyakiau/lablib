-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    student_id VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 図書テーブル
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn VARCHAR(13),
    jan VARCHAR(13),
    ean13 VARCHAR(13),
    type VARCHAR(10) NOT NULL CHECK (type IN ('book', 'paper')),
    total_copies INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 図書コピーテーブル
CREATE TABLE IF NOT EXISTS book_copies (
    id UUID PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    serial_number VARCHAR(20) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    location TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 貸出記録テーブル
CREATE TABLE IF NOT EXISTS borrow_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECK (status IN ('borrowed', 'returned')),
    CONSTRAINT valid_return_date CHECK (
        (returned_at IS NULL) OR
        (returned_at >= borrowed_at)
    )
);

-- 管理者ログテーブル
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_id UUID,
    created_at TIMESTAMP NOT NULL
);

-- 月次ランキングテーブル
CREATE TABLE IF NOT EXISTS monthly_rankings (
    id UUID PRIMARY KEY,
    month VARCHAR(7) NOT NULL,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrow_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(month, book_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_jan ON books(jan);
CREATE INDEX IF NOT EXISTS idx_books_ean13 ON books(ean13);
CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_user_id ON borrow_records(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_book_copy_id ON borrow_records(book_copy_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_monthly_rankings_month ON monthly_rankings(month); 