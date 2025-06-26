# Suno APIローカルサーバーセットアップガイド

## 概要
WalkTunesアプリケーションは、localhost:3000で動作するSuno APIサーバーを使用して音楽生成を行います。

## セットアップ手順

### 方法1: 公式Suno APIプロキシサーバーを使用

1. **Suno APIプロキシサーバーをクローン**
```bash
# 新しいターミナルウィンドウで実行
git clone https://github.com/SunoAI/suno-api.git
cd suno-api
```

2. **依存関係をインストール**
```bash
npm install
# または
yarn install
```

3. **環境変数を設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集してSuno APIキーを設定：
```env
SUNO_API_KEY=your_suno_api_key_here
```

4. **サーバーを起動**
```bash
npm start
# または
yarn start
```

サーバーがlocalhost:3000で起動することを確認してください。

### 方法2: 代替のSuno APIサーバーを使用

もし公式サーバーが利用できない場合は、以下の代替サーバーを試してください：

1. **SunoAPI.orgのローカルプロキシ**
```bash
git clone https://github.com/sunoapi-org/suno-api.git
cd suno-api
npm install
```

2. **設定ファイルを編集**
```bash
cp config.example.json config.json
```

`config.json`を編集：
```json
{
  "port": 3000,
  "suno_api_key": "your_api_key_here"
}
```

3. **サーバーを起動**
```bash
npm start
```

### 方法3: Docker を使用

1. **Dockerfileを作成**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Dockerイメージをビルド・実行**
```bash
docker build -t suno-api-server .
docker run -p 3000:3000 -e SUNO_API_KEY=your_api_key_here suno-api-server
```

## 動作確認

サーバーが正常に起動したら、以下のコマンドで動作確認を行ってください：

```bash
# クォータ情報の取得
curl http://localhost:3000/api/get_limit

# 期待される応答例
{
  "credits_left": 100,
  "monthly_limit": 500,
  "monthly_usage": 0
}
```

## 必要なエンドポイント

WalkTunesアプリケーションは以下のエンドポイントを使用します：

- `POST /api/generate` - 音楽生成リクエスト
- `GET /api/get?ids=xxx` - 生成された音楽の情報取得
- `GET /api/get_limit` - API使用量・制限の確認

## トラブルシューティング

### ポート3000が使用中の場合
```bash
# ポート使用状況を確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### APIキーの問題
- Suno AIの公式サイトでAPIキーを取得
- 環境変数が正しく設定されているか確認
- APIキーの有効性を確認

### 依存関係の問題
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## セキュリティ注意事項

- APIキーは環境変数で管理
- 本番環境では適切なCORS設定を行う
- レート制限を適切に設定

## 参考リンク

- [Suno AI 公式サイト](https://suno.ai/)
- [Suno API ドキュメント](https://docs.suno.ai/)
- [SunoAPI.org](https://sunoapi.org/)