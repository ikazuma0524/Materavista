# LAMMPS Simulation Platform

分子動力学シミュレーションを自然言語の指示から実行できるウェブアプリケーション。

## アーキテクチャ概要

このアプリケーションは3つの主要コンポーネントで構成されています：

1. **フロントエンド (Next.js)**: ユーザーが自然言語でシミュレーション条件を入力し、結果を可視化するUI
2. **バックエンド (FastAPI)**: シミュレーションの実行とデータ処理を担当するAPI
3. **LAMMPS Dockerコンテナ**: 実際のシミュレーション計算を実行する環境

## 機能

- **自然言語→LAMMPSインプットファイル変換**: OpenAI APIを利用して自然言語の指示からLAMMPSの入力ファイルを自動生成
- **シミュレーション実行**: 生成された入力ファイルを使用してLAMMPSシミュレーションを実行
- **結果解析・可視化**: ASEを使用してシミュレーション結果を処理し、Plotlyでグラフ表示

## 開発環境セットアップ

### 前提条件

- Docker と Docker Compose
- Node.js (v18以上)
- Python 3.9以上

### 環境変数設定

`.env`ファイルをプロジェクトルートに作成し、以下の変数を設定してください：

```
OPENAI_API_KEY=your_openai_api_key
```

### インストール手順

1. リポジトリをクローン：

```bash
git clone [このリポジトリのURL]
cd lammps-simulation-platform
```

2. バックエンド依存関係のインストール：

```bash
cd backend
pip install -r requirements.txt
cd ..
```

3. フロントエンド依存関係のインストール：

```bash
cd frontend
npm install
cd ..
```

### 開発モードでの実行

1. バックエンドの起動：

```bash
cd backend
uvicorn app.main:app --reload
```

2. 別ターミナルでフロントエンドの起動：

```bash
cd frontend
npm run dev
```

3. ブラウザで http://localhost:3000 にアクセス

### Docker Composeでの実行（推奨）

すべてのコンポーネントを一度に起動：

```bash
docker-compose up -d
```

ブラウザで http://localhost:3000 にアクセス

## テスト

### バックエンドテスト

```bash
cd backend
pytest
```

## 使用方法

1. アプリケーションにアクセスし、テキストエリアに「100個のアルゴン原子を含むシミュレーションを300Kで実行して」などのシミュレーション条件を自然言語で入力します。

2. 「Generate LAMMPS Input」ボタンをクリックすると、OpenAI APIが自然言語からLAMMPS入力ファイルを生成します。

3. 生成された入力ファイルが表示されます。必要に応じて編集可能です。

4. 「Run Simulation」ボタンをクリックするとシミュレーションが実行されます。

5. シミュレーション結果（平均二乗変位、ポテンシャルエネルギーなど）がグラフとして表示されます。

## プロジェクト構造

```
.
├── backend/               # FastAPIバックエンド
│   ├── app/               # アプリケーションコード
│   │   ├── services/      # LAMMPSやASEなどのサービス
│   │   ├── routers/       # APIエンドポイント
│   │   └── main.py        # アプリケーションのエントリーポイント
│   ├── tests/             # バックエンドテスト
│   ├── Dockerfile         # LAMMPSコンテナ用Dockerfile
│   └── Dockerfile.fastapi # FastAPI用Dockerfile
├── frontend/              # Next.jsフロントエンド
│   ├── src/               # ソースコード
│   │   ├── components/    # Reactコンポーネント
│   │   ├── services/      # APIサービス
│   │   ├── types/         # TypeScript型定義
│   │   └── pages/         # ページコンポーネント
│   └── Dockerfile         # フロントエンド用Dockerfile
├── docker-compose.yml     # Docker Compose設定
└── README.md              # このファイル
```

## ライセンス

MIT

## 開発者向け情報

### API仕様

バックエンドのAPIエンドポイントは以下のとおりです：

- `GET /health` - APIの稼働状況を確認
- `POST /generate-input/` - 自然言語からLAMMPS入力ファイルを生成
- `POST /run-lammps/` - LAMMPSシミュレーションを実行
- `POST /cleanup/` - 古いシミュレーションファイルを削除
