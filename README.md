# WalkTunes - AI Music for Your Journey

GPS位置情報とリアルタイム歩行データを活用し、Suno AIによる動的音楽生成でウォーキング体験を革新的に向上させるモバイルファーストWebアプリケーション。

## 🎵 主な機能

- **リアルタイムウォーキングトラッキング**: GPS位置情報を使用した高精度な歩行データ収集
- **AI音楽生成**: Suno AIを使用して歩行データに基づいたパーソナライズされた楽曲生成
- **環境適応**: 時間帯・天気・場所に応じた動的音楽調整
- **ゲーミフィケーション**: レベルアップ・バッジ・称号システム
- **クラウド同期**: Supabaseを使用したデータ同期（オプション）

## 🚀 セットアップ

### 前提条件

1. **Node.js** (v18以上)
2. **Suno API ローカルサーバー** (localhost:3000で動作)

### Suno API ローカルサーバーのセットアップ

このアプリケーションは、localhost:3000で動作するSuno APIサーバーを使用します。

1. Suno APIサーバーをクローン・セットアップ
2. サーバーを localhost:3000 で起動
3. 以下のエンドポイントが利用可能であることを確認：
   - `POST /api/generate` - 音楽生成
   - `GET /api/get?ids=xxx` - 音楽情報取得
   - `GET /api/get_limit` - クォータ情報取得

### アプリケーションのセットアップ

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd walktunes
```

2. **依存関係をインストール**
```bash
npm install
```

3. **環境変数を設定** (オプション)
```bash
cp .env.example .env
```

`.env`ファイルを編集して以下を設定：
```env
# Supabase (オプション - クラウド同期用)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenWeatherMap (オプション - 天気情報用)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

4. **開発サーバーを起動**
```bash
npm run dev
```

## 🎯 使用方法

### 基本的な使い方

1. **ウォーキング開始**: ダッシュボードで「ウォーキング開始」ボタンをクリック
2. **位置情報許可**: ブラウザの位置情報アクセス許可を承認
3. **歩行**: アプリがGPSデータを自動収集
4. **ウォーキング終了**: 「ウォーキング終了」ボタンをクリック
5. **音楽生成**: 歩行データに基づいてSuno AIが自動で楽曲を生成

### 楽曲の確認

- **自動チェック**: 30秒ごとに生成中の楽曲の完了状況を自動確認
- **手動チェック**: 「楽曲読み込み」ボタンで即座に確認
- **音楽ライブラリ**: 生成された全楽曲を管理・再生

## 🔧 技術仕様

### フロントエンド
- **React 18.3.1** + TypeScript
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール
- **Lucide React** - アイコン

### バックエンド・API
- **Suno API** (localhost:3000) - 音楽生成
- **Geolocation API** - GPS位置情報
- **OpenWeatherMap API** - 天気情報 (オプション)
- **Supabase** - データベース・認証 (オプション)

### データ管理
- **ローカルストレージ** - オフライン対応
- **Supabase** - クラウド同期 (オプション)

## 📱 対応ブラウザ

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## 🔒 プライバシー・セキュリティ

- 位置情報は音楽生成にのみ使用
- ユーザーの明示的な同意なしに位置データを送信しない
- HTTPS必須（位置情報API要件）
- データの暗号化・匿名化

## 🚨 トラブルシューティング

### よくある問題

1. **位置情報が取得できない**
   - ブラウザの位置情報許可を確認
   - HTTPS接続を確認

2. **音楽生成が失敗する**
   - Suno APIサーバー (localhost:3000) が起動していることを確認
   - ネットワーク接続を確認

3. **楽曲が完了しない**
   - 「楽曲読み込み」ボタンで手動確認
   - 数分待ってから再度確認

### エラーメッセージ

- **"Cannot connect to Suno API server"**: localhost:3000でSuno APIサーバーが起動していません
- **"位置情報エラー"**: GPS/位置情報の許可が必要です
- **"Insufficient credits"**: Suno APIのクレジットが不足しています

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [Suno AI](https://suno.ai/) - AI音楽生成技術
- [OpenWeatherMap](https://openweathermap.org/) - 天気情報API
- [Supabase](https://supabase.com/) - バックエンドサービス