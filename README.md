# LabLib

## 使用技術
- Vite (React + TypeScript)
- Go 1.21（Ginフレームワーク）
- PostgreSQL 15
- Docker, Docker Compose
- Node.js

## システム構成
- **フロントエンド**: Vite + React + TypeScript
- **バックエンド**: Go + Gin
- **データベース**: PostgreSQL（初期化SQL自動適用）
- **全てDocker Composeで一括起動・管理**

## Dockerを使用した開発環境のセットアップ

### 前提条件
- Docker
- Docker Compose

### 起動方法
1. リポジトリをクローン
```bash
git clone https://github.com/Rintaras/LabLib
cd LabLib
```

2. Dockerコンテナのビルドと起動
```bash
docker compose up --build -d
```

3. アプリケーションにアクセス
- フロントエンド: ブラウザで http://localhost:5173
- バックエンドAPI: http://localhost:8080

### コンテナの停止
```bash
docker compose down
```

### データベース初期化
- PostgreSQLは初回起動時に `backend/db/schema.sql` を自動で適用します。
- データは `db_data` ボリュームに永続化されます。
- スキーマ変更時は `docker compose down -v` でボリュームを削除して再起動してください。

### バックエンド環境変数（docker-composeで自動設定）
- DB_HOST=db
- DB_PORT=5432
- DB_USER=labuser
- DB_PASSWORD=labpass
- DB_NAME=lablib

### API認証
- 多くのAPIはJWT認証が必要です。
- `/api/auth/login` でトークンを取得し、`Authorization: Bearer <token>` ヘッダを付与してください。

## 開発時の注意点
- ホットリロードが有効になっているため、ソースコードの変更は自動的に反映されます
- node_modulesはコンテナ内にマウントされているため、ローカル環境にインストールする必要はありません 

## 外部アクセスについて

Viteサーバーは`--host`オプションで0.0.0.0バインドされているため、
`http://<サーバーのIP>:5173/` で他のホストからアクセス可能です。

## ポート
- 5173: Vite (React開発サーバー)
- 8080: GoバックエンドAPI
- 5432: PostgreSQL 