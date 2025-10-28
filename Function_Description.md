# LabLib プロジェクト ファイル構成解説

このドキュメントでは、LabLib（研究室図書管理システム）を構成する各ファイルの役割と働きについて詳しく解説します。

---

## 📁 ルートディレクトリのファイル

### .dockerignore
**役割**: Dockerイメージビルド時に除外するファイル・ディレクトリを指定  
**働き**: 
- `node_modules`や`.git`などの不要なファイルをDockerイメージに含めないことで、イメージサイズを削減
- ビルド時間の短縮とセキュリティ向上に貢献

### .gitignore
**役割**: Gitリポジトリに含めないファイル・ディレクトリを指定  
**働き**:
- 依存関係(`node_modules`)、ビルド成果物、環境変数ファイルなどを除外
- リポジトリのクリーンさを保ち、不要なファイルの追跡を防止

### docker-compose.yml
**役割**: 複数のDockerコンテナを一括管理する設定ファイル  
**働き**:
- フロントエンド（Vite）、バックエンド（Go）、データベース（PostgreSQL）の3サービスを定義
- 各コンテナ間のネットワーク接続や環境変数を設定
- `docker-compose up`コマンドで全サービスを一括起動

### Dockerfile
**役割**: フロントエンド用のDockerイメージをビルドする設定  
**働き**:
- Node.js環境をベースイメージとして使用
- 依存関係のインストールとアプリケーションのセットアップ
- Vite開発サーバーを起動

### eslint.config.js
**役割**: ESLintのコード品質チェックツールの設定  
**働き**:
- TypeScript/Reactコードの静的解析ルールを定義
- コーディング規約の統一とバグの早期発見
- 開発時の品質向上をサポート

### Function_Description.md
**役割**: プロジェクトの機能説明ドキュメント  
**働き**:
- システムの主要機能（書籍管理、貸出返却、ランキングなど）を文書化
- 開発者や利用者への機能理解を支援

### get-docker.sh
**役割**: Dockerのインストールスクリプト  
**働き**:
- Linux環境でDockerを自動インストール
- 開発環境のセットアップを簡略化

### index.html
**役割**: アプリケーションのエントリーポイントとなるHTMLファイル  
**働き**:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>LabLib - 研究室図書管理システム</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
- Reactアプリケーションがマウントされる`#root`要素を提供
- メインのTypeScriptファイルを読み込み

### package.json
**役割**: Node.jsプロジェクトの設定と依存関係の管理  
**働き**:
- 使用するnpmパッケージとそのバージョンを定義
- ビルド、開発サーバー起動などのスクリプトを登録
- プロジェクトのメタ情報を保持

### postcss.config.js
**役割**: PostCSS（CSSプロセッサ）の設定  
**働き**:
- Tailwind CSSの処理を有効化
- CSSの最適化やベンダープレフィックスの自動付与

### README.md
**役割**: プロジェクトの説明書  
**働き**:
- システム概要、技術スタック、セットアップ方法を記載
- 新規開発者のオンボーディングを支援
- 主要な内容:
  - 使用技術: Vite, React, TypeScript, Go, PostgreSQL, Docker
  - 起動方法: `docker-compose up -d`
  - ポート情報: 5173(フロント), 8080(バック), 5432(DB)

### tailwind.config.js
**役割**: Tailwind CSSフレームワークの設定  
**働き**:
- カスタムカラー、フォント、レスポンシブブレークポイントを定義
- ダークモード対応の設定
- デザインシステムの統一

### tsconfig.json / tsconfig.app.json / tsconfig.node.json
**役割**: TypeScriptコンパイラの設定ファイル群  
**働き**:
- `tsconfig.json`: プロジェクト全体の基本設定
- `tsconfig.app.json`: アプリケーションコード用の設定
- `tsconfig.node.json`: ビルドツール（Vite）用の設定
- 型チェックのルールやモジュール解決方法を定義

### vite.config.ts
**役割**: Viteビルドツールの設定  
**働き**:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://lablib-backend-1:8080',
        changeOrigin: true,
      },
    },
  },
});
```
- Reactプラグインの有効化
- APIリクエストをバックエンドにプロキシ転送
- 開発サーバーの最適化設定

---

## 📁 backend/ - バックエンドディレクトリ

### backend/Dockerfile
**役割**: Go言語バックエンドのDockerイメージビルド設定  
**働き**:
- Go 1.21ベースイメージを使用
- 依存関係のダウンロードとアプリケーションのビルド
- APIサーバーの起動

### backend/go.mod
**役割**: Goモジュールの依存関係管理ファイル  
**働き**:
- 使用するGoパッケージ（Gin, PostgreSQLドライバなど）を定義
- バージョン管理とモジュール解決

### backend/main.go
**役割**: バックエンドアプリケーションのエントリーポイント  
**働き**:
- データベース接続の初期化
- ルーティング設定（API エンドポイントの定義）
- 主要なルート:
  - `/api/auth/*`: 認証関連
  - `/api/books/*`: 書籍管理
  - `/api/borrow/*`: 貸出返却
  - `/api/admin/*`: 管理者機能
- CORSミドルウェアの適用
- サーバーの起動（ポート8080）

### backend/api/admin.go
**役割**: 管理者向けAPI機能の実装  
**働き**:
- ユーザー一覧取得 (`GetUsers`)
- 月次ランキング取得 (`GetMonthlyRankings`)
- 管理者専用の統計情報や設定を提供

### backend/api/auth.go
**役割**: 認証・認可機能の実装  
**働き**:
- ユーザー登録 (`Register`)
- ログイン処理 (`Login`)
- JWTトークンの生成と検証
- パスワードのハッシュ化

### backend/api/barcode.go
**役割**: バーコード生成・管理機能  
**働き**:
- 論文用バーコード画像の生成 (`GenerateThesisBarcode`)
- 保存済みバーコード一覧取得 (`GetSavedBarcodes`)
- バーコード画像のダウンロード (`DownloadBarcodeImage`)
- バーコード画像の削除 (`DeleteBarcodeImage`)
- バーコード画像ファイルの管理

### backend/api/book_images.go
**役割**: 書籍画像のアップロード・削除機能  
**働き**:
- 書籍カバー画像のアップロード (`UploadBookImage`)
- 書籍画像の削除 (`DeleteBookImage`)
- ファイルサイズや形式のバリデーション
- 画像ファイルの保存先管理

### backend/api/books.go
**役割**: 書籍管理のCRUD操作  
**働き**:
- 書籍一覧取得（検索・フィルタリング対応）
- 書籍詳細情報取得
- 新規書籍登録
- 書籍情報更新
- 書籍削除
- 書籍の在庫状態管理

### backend/api/database.go
**役割**: データベース操作のユーティリティ  
**働き**:
- テーブル一覧取得 (`GetTableNames`)
- テーブルデータ取得 (`GetTableData`)
- データベース接続の初期化 (`InitDB`)
- データベースインスタンスの取得 (`GetDB`)

### backend/config/config.go
**役割**: アプリケーション設定の一元管理  
**働き**:
- 環境変数の読み込み
- データベース接続情報の管理
- JWTシークレットキーの管理
- デフォルト値の設定

### backend/db/schema.sql
**役割**: データベーススキーマ定義  
**働き**:
- テーブル構造の定義:
  - `users`: ユーザー情報
  - `books`: 書籍情報
  - `borrowing_records`: 貸出記録
  - その他関連テーブル
- インデックスの設定
- 制約（外部キー、NOT NULLなど）の定義
- 初期データの投入

### backend/middleware/auth.go
**役割**: 認証ミドルウェアの実装  
**働き**:
- JWTトークンの検証
- リクエストヘッダーからトークンを抽出
- ユーザー情報をコンテキストに設定
- 未認証リクエストの拒否

### backend/models/book.go
**役割**: 書籍データモデルの定義  
**働き**:
- 書籍の構造体定義
- フィールド: ID, タイトル, 著者, タイプ, バーコード, 在庫状況など
- JSON/DBマッピング用のタグ付け

### backend/models/user.go
**役割**: ユーザーデータモデルの定義  
**働き**:
- ユーザーの構造体定義
- フィールド: ID, ユーザー名, メール, パスワード, ロールなど
- パスワードフィールドのJSON除外設定

---

## 📁 public/ - 公開静的ファイル

### public/barcodes/.gitkeep
**役割**: 空ディレクトリの保持  
**働き**:
- バーコード画像保存用ディレクトリをGitで追跡
- 実際のバーコードファイルは.gitignoreで除外

### public/images/books/.gitkeep
**役割**: 空ディレクトリの保持  
**働き**:
- 書籍カバー画像保存用ディレクトリをGitで追跡
- 実際の画像ファイルは.gitignoreで除外

---

## 📁 src/ - フロントエンドソースコード

### src/App.tsx
**役割**: Reactアプリケーションのルートコンポーネント  
**働き**:
- ルーティング設定（React Router使用）
- 認証状態に応じたページ遷移制御
- グローバルレイアウトの適用
- テーマプロバイダーの配置

### src/index.css
**役割**: グローバルスタイルシート  
**働き**:
- Tailwind CSSのベーススタイルをインポート
- カスタムCSSの定義
- リセットCSSの適用

### src/main.tsx
**役割**: Reactアプリケーションのエントリーポイント  
**働き**:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```
- Reactアプリケーションをマウント
- StrictModeで開発時の警告を有効化

### src/vite-env.d.ts
**役割**: Vite環境の型定義  
**働き**:
- Vite固有の型情報を提供
- TypeScriptの型チェックを支援

---

## 📁 src/components/ - UIコンポーネント

### src/components/admin/AdminPanel.tsx
**役割**: 管理者パネルのメインコンポーネント  
**働き**:
- 管理者向けダッシュボードの表示
- ユーザー管理、統計情報の表示
- 管理機能へのナビゲーション

### src/components/admin/BarcodeGenerator.tsx
**役割**: バーコード生成UI  
**働き**:
- 論文用バーコードの生成フォーム
- 年度・学籍番号・著者名の入力
- 生成されたバーコード画像の表示
- 保存済みバーコードの管理
- ダウンロード・削除機能

### src/components/admin/BookEditModal.tsx
**役割**: 書籍編集モーダルダイアログ  
**働き**:
- 既存書籍情報の編集フォーム
- バリデーション機能
- 更新処理とエラーハンドリング

### src/components/admin/BookRegistration.tsx
**役割**: 新規書籍登録フォーム  
**働き**:
- 書籍情報の入力フォーム
- タイトル、著者、タイプ、バーコード、配架場所などの入力
- 書籍画像のアップロード機能
- 登録処理とバリデーション

### src/components/admin/UserRegistration.tsx
**役割**: 新規ユーザー登録フォーム  
**働き**:
- ユーザー情報の入力
- メールアドレス、パスワードの設定
- ロール（一般/管理者）の選択
- 登録処理とエラーハンドリング

### src/components/auth/LoginForm.tsx
**役割**: ログインフォームコンポーネント  
**働き**:
- メールアドレス・パスワード入力
- ログイン処理の実行
- 認証エラーの表示
- 認証成功時のリダイレクト

### src/components/books/BarcodeScanner.tsx
**役割**: バーコードスキャン機能（予定）  
**働き**:
- カメラを使用したバーコード読み取り
- スキャン結果の書籍検索
- 貸出返却処理への連携

### src/components/books/BookDetails.tsx
**役割**: 書籍詳細表示コンポーネント  
**働き**:
- 書籍の詳細情報を表示
- カバー画像の表示
- 在庫状況の表示
- 貸出・予約ボタンの提供

### src/components/books/BookList.tsx
**役割**: 書籍一覧表示コンポーネント  
**働き**:
- グリッド形式での書籍表示
- 書籍カードのレンダリング
- ページネーション機能
- 一覧から詳細ページへの遷移

### src/components/books/SearchBar.tsx
**役割**: 書籍検索バーコンポーネント  
**働き**:
- キーワード検索入力
- フィルター機能（タイプ、在庫状況）
- リアルタイム検索
- 検索結果の更新

### src/components/borrowing/BorrowingHistory.tsx
**役割**: 貸出履歴表示コンポーネント  
**働き**:
- ユーザーの過去の貸出記録を表示
- 返却日、延滞情報の表示
- 履歴のフィルタリング・ソート

### src/components/borrowing/BorrowingList.tsx
**役割**: 現在の貸出中書籍一覧  
**働き**:
- 貸出中の書籍リストを表示
- 返却予定日の表示
- 延滞状況の強調表示
- 返却処理へのリンク

### src/components/borrowing/BorrowingRecordDetails.tsx
**役割**: 貸出記録詳細コンポーネント  
**働き**:
- 個別の貸出記録の詳細表示
- 貸出日時、返却予定日、実際の返却日
- 延滞日数の計算と表示

### src/components/layout/Header.tsx
**役割**: ページヘッダーコンポーネント  
**働き**:
- アプリケーションタイトルの表示
- ナビゲーションメニュー
- ユーザー情報表示
- ログアウトボタン
- ダークモード切り替え

### src/components/layout/Layout.tsx
**役割**: 全体のレイアウト構造  
**働き**:
- ヘッダー、サイドバー、メインコンテンツエリアの配置
- レスポンシブデザインの適用
- 子コンポーネントのラップ

### src/components/layout/Sidebar.tsx
**役割**: サイドバーナビゲーション  
**働き**:
- メニュー項目の表示
- 現在のページのハイライト
- アイコン付きナビゲーション
- モバイル対応の折りたたみ機能

### src/components/ui/Tabs.tsx
**役割**: タブコンポーネント  
**働き**:
- タブ切り替えUI
- アクティブタブの管理
- コンテンツエリアの切り替え
- 再利用可能なUIパーツ

---

## 📁 src/contexts/ - Reactコンテキスト

### src/contexts/AuthContext.tsx
**役割**: 認証状態の管理  
**働き**:
- ログインユーザー情報の保持
- 認証トークンの管理
- ログイン・ログアウト関数の提供
- 認証状態の全コンポーネントへの提供

### src/contexts/ThemeContext.tsx
**役割**: テーマ（ダークモード）の管理  
**働き**:
- ライト/ダークモードの切り替え
- ユーザーの選択をローカルストレージに保存
- システム設定の検出
- テーマ状態の全コンポーネントへの提供

---

## 📁 src/pages/ - ページコンポーネント

### src/pages/AdminPage.tsx
**役割**: 管理者ページ  
**働き**:
- 管理者専用機能へのアクセス
- ユーザー管理、書籍登録、統計表示
- 権限チェック

### src/pages/BookDetailsPage.tsx
**役割**: 書籍詳細ページ  
**働き**:
- 個別書籍の詳細情報表示
- 貸出・予約ボタン
- 関連書籍の表示

### src/pages/BooksPage.tsx
**役割**: 書籍一覧ページ  
**働き**:
- すべての書籍の一覧表示
- 検索・フィルター機能の統合
- ページネーション

### src/pages/BorrowReturnPage.tsx
**役割**: 貸出・返却処理ページ  
**働き**:
- 書籍の貸出処理
- 書籍の返却処理
- バーコードスキャン機能の統合

### src/pages/HistoryPage.tsx
**役割**: 貸出履歴ページ  
**働き**:
- ユーザーの貸出履歴表示
- 履歴のフィルタリング
- 統計情報の表示

### src/pages/LoginPage.tsx
**役割**: ログインページ  
**働き**:
- ログインフォームの表示
- 認証処理
- 認証後のリダイレクト

### src/pages/RankingPage.tsx
**役割**: ランキングページ  
**働き**:
```typescript
// 人気書籍・論文のランキング表示
// 月次・年次のランキング切り替え
// 貸出回数に基づくランキング
```
- 貸出回数の多い書籍・論文を表示
- 期間別のランキング（月次・年次）
- グラフィカルな表示

### src/pages/SearchPage.tsx
**役割**: 検索ページ  
**働き**:
- 詳細検索機能
- 複数条件での検索
- 検索結果の表示

---

## 📁 src/types/ - 型定義

### src/types/index.ts
**役割**: TypeScript型定義の集約  
**働き**:
```typescript
export interface Book {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'thesis';
  barcode: string;
  available: boolean;
  location: string;
  copies: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface BorrowingRecord {
  id: string;
  bookId: string;
  userId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
}
```
- 書籍、ユーザー、貸出記録などの型定義
- API レスポンスの型
- 型安全性の確保

---

## 📁 src/utils/ - ユーティリティ関数

### src/utils/dates.ts
**役割**: 日付操作ユーティリティ  
**働き**:
- 日付のフォーマット変換
- 期限日の計算
- 延滞日数の計算
- 日付の比較関数

### src/utils/mockData.ts
**役割**: 開発用のモックデータ  
**働き**:
```typescript
export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'リーダブルコード',
    author: 'Dustin Boswell, Trevor Foucher',
    type: 'book',
    barcode: 'B0001',
    available: true,
    location: '書棚A-1',
    copies: 3
  },
  // ...
];
```
- 開発・テスト用のサンプルデータ提供
- APIが未実装の段階でのフロントエンド開発を支援
- データ構造の確認用

---

## 🔗 ファイル間の関係性

### データフロー
1. **フロントエンド** → **バックエンド**
   - `src/pages/` からAPIリクエスト
   - `vite.config.ts` のプロキシ設定で `/api` をバックエンドに転送
   - `backend/main.go` でルーティング
   - `backend/api/` で処理実行

2. **認証フロー**
   - `LoginPage.tsx` → `AuthContext.tsx` → `backend/api/auth.go`
   - JWTトークン生成 → ローカルストレージ保存
   - `middleware/auth.go` でトークン検証

3. **データベースアクセス**
   - `backend/api/*.go` → `backend/models/` → `db/schema.sql`
   - PostgreSQL接続は `backend/config/config.go` で管理

### 設定ファイルの連携
- `docker-compose.yml` が全サービスを統合
- `Dockerfile` でコンテナイメージをビルド
- `vite.config.ts` と `tailwind.config.js` がフロントエンドビルドを制御
- `tsconfig.json` がTypeScriptコンパイルを制御

---

## 📝 まとめ

このプロジェクトは、以下の構造で組織化されています:

1. **インフラ層**: Docker関連ファイルで環境構築
2. **バックエンド層**: Go + Gin でRESTful API提供
3. **データ層**: PostgreSQLでデータ永続化
4. **フロントエンド層**: React + TypeScript でUI構築
5. **状態管理**: Context APIで認証・テーマを管理

各ファイルは明確な責任を持ち、モジュール化されたアーキテクチャを形成しています。