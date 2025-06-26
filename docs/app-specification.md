# Suno AI連携ウォーキング音楽生成アプリ 仕様書

## 1. プロジェクト概要

### 1.1 アプリケーション名
**WalkTunes** - AI Music for Your Journey

### 1.2 プロジェクト目的
GPS位置情報とリアルタイム歩行データを活用し、Suno AIによる動的音楽生成でウォーキング体験を革新的に向上させるモバイルファーストWebアプリケーション。

### 1.3 ターゲットユーザー
- 日常的にウォーキングを行う健康志向の個人
- 音楽愛好家・新しい音楽体験を求めるユーザー
- フィットネス・ウェルネス分野のテクノロジー早期採用者
- 年齢層：20-50代、スマートフォン利用に慣れ親しんだユーザー

### 1.4 主要価値提案
- **パーソナライズされた音楽体験**: 個人の歩行パターンに完全に適応した楽曲生成
- **リアルタイム環境適応**: 時間帯・天気・場所に応じた動的音楽調整
- **ゲーミフィケーション**: 継続的なモチベーション維持システム
- **完全自動化**: 手動操作不要の seamless な音楽生成体験

## 2. 技術仕様

### 2.1 フロントエンド技術スタック
- **フレームワーク**: React 18.3.1 + TypeScript 5.5.3
- **ビルドツール**: Vite 5.4.2
- **スタイリング**: Tailwind CSS 3.4.1
- **アイコン**: Lucide React 0.344.0
- **状態管理**: React Context API + useReducer
- **PWA対応**: Service Worker + Web App Manifest

### 2.2 バックエンド・API連携
- **Suno AI API**: v1/v2 音楽生成エンドポイント
- **Geolocation API**: ブラウザネイティブGPS機能
- **OpenWeatherMap API**: 天気情報取得（オプション）
- **ローカルストレージ**: IndexedDB/localStorage ハイブリッド

### 2.3 デプロイメント環境
- **ホスティング**: Netlify/Vercel対応
- **CDN**: 静的アセット配信最適化
- **HTTPS**: 必須（Geolocation API要件）
- **PWA**: オフライン対応・アプリインストール可能

## 3. 機能仕様

### 3.1 コア機能

#### 3.1.1 ウォーキングトラッキングシステム
**概要**: GPS位置情報を活用したリアルタイム歩行データ収集・分析

**詳細機能**:
- **GPS位置追跡**: 
  - 高精度位置情報取得（accuracy < 10m推奨）
  - 1秒間隔での位置更新
  - バックグラウンド追跡対応
- **移動データ計算**:
  - リアルタイム速度計算（km/h）
  - 累積距離測定（Haversine公式使用）
  - 移動時間・休憩時間の自動判別
  - 標高変化検出（上り坂・下り坂）
- **データ精度向上**:
  - GPS精度フィルタリング（accuracy > 50m除外）
  - 移動速度異常値除去（>20km/h除外）
  - 静止状態検出（<0.5km/h, 30秒以上）

**技術実装**:
```typescript
interface WalkingData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  distance: number; // meters
  speed: number; // current km/h
  avgSpeed: number; // average km/h
  maxSpeed: number; // maximum km/h
  steps: number; // estimated
  calories: number; // estimated
  positions: GeolocationPosition[];
  elevationGain: number; // meters
  elevationLoss: number; // meters
}
```

#### 3.1.2 環境データ収集システム
**概要**: 歩行環境の自動分析・分類による音楽生成パラメータ最適化

**詳細機能**:
- **時間帯判定**:
  - 朝（5:00-12:00）: 明るく活動的な音楽
  - 昼（12:00-17:00）: 安定したリズムの音楽
  - 夕（17:00-21:00）: 温かみのある音楽
  - 夜（21:00-5:00）: 落ち着いた音楽
- **地域タイプ推定**:
  - 公園・自然エリア: アコースティック・ネイチャーサウンド
  - 都市部・商業地: アップビート・エレクトロニック
  - 住宅街: 穏やかなポップ・アンビエント
  - 駅前・交通量多: エネルギッシュ・モチベーショナル
- **天気情報連携**:
  - 晴れ: 明るく軽快な音楽
  - 曇り: 落ち着いた音楽
  - 雨: 室内向け・リラックス音楽
  - 気温・湿度: BPM・音色調整に反映

**技術実装**:
```typescript
interface EnvironmentData {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    description: string;
  };
  location: {
    type: 'park' | 'urban' | 'residential' | 'station' | 'commercial' | 'nature';
    name: string;
  };
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}
```

#### 3.1.3 Suno AI音楽生成システム
**概要**: 歩行データ・環境データを基にした動的音楽生成・管理

**Suno AI API連携仕様**:
- **エンドポイント**: `https://api.suno.ai/v1/generate`
- **認証**: Bearer Token方式
- **レート制限**: 100リクエスト/時間（プラン依存）
- **音楽長**: 30-90秒（ウォーキング用最適化）

**プロンプト生成アルゴリズム**:
```typescript
function generateSunoPrompt(walkData: WalkingData, envData: EnvironmentData): string {
  const { speed, avgSpeed, duration } = walkData;
  const { timeOfDay, weather, location } = envData;
  
  let prompt = "Create ";
  
  // エネルギーレベル（速度ベース）
  if (avgSpeed < 3) prompt += "relaxed, peaceful ";
  else if (avgSpeed > 5) prompt += "energetic, upbeat ";
  else prompt += "steady, moderate ";
  
  // 時間帯特性
  const timeDescriptors = {
    morning: "bright morning ",
    afternoon: "warm afternoon ",
    evening: "golden sunset ",
    night: "calm nighttime "
  };
  prompt += timeDescriptors[timeOfDay];
  
  // 場所特性
  const locationDescriptors = {
    park: "nature-inspired with bird sounds, ",
    urban: "city-vibe with urban rhythm, ",
    residential: "peaceful neighborhood, ",
    station: "commuter-friendly, ",
    commercial: "shopping district energy, ",
    nature: "wilderness adventure, "
  };
  prompt += locationDescriptors[location.type];
  
  // BPM計算（歩行速度 × 20）
  const bpm = Math.round(avgSpeed * 20);
  prompt += `music at ${bpm} BPM for walking, inspiring and motivational`;
  
  // 天気要素
  if (weather.condition === 'rain') prompt += ", with gentle rain ambience";
  if (weather.condition === 'sunny') prompt += ", bright and cheerful";
  
  return prompt;
}
```

**生成フロー**:
1. **リクエスト送信**: プロンプト・パラメータをSuno APIに送信
2. **ジョブ監視**: job_idによる生成状況ポーリング（5秒間隔）
3. **完了処理**: 音声ファイルURL取得・ローカル保存
4. **メタデータ管理**: 楽曲情報・生成条件の永続化
5. **エラーハンドリング**: API制限・クレジット不足・ネットワークエラー対応

**技術実装**:
```typescript
interface SunoTrack {
  id: string;
  title: string;
  prompt: string;
  duration: number;
  genre: string;
  mood: string;
  bpm: number;
  audioUrl?: string;
  imageUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  jobId?: string;
  createdAt: Date;
  walkingData: WalkingData;
  environmentData: EnvironmentData;
  tags: string[];
}
```

### 3.2 ユーザーインターフェース仕様

#### 3.2.1 ダッシュボード画面
**レイアウト**: モバイルファースト・カード式レイアウト

**主要コンポーネント**:
- **ヘッダー**: アプリロゴ・ユーザーレベル・XPプログレスバー
- **統計カード**: 総距離・生成楽曲数・ウォーキング回数・総時間
- **ウォーキングトラッカー**: リアルタイムデータ表示・開始/停止ボタン
- **最近の楽曲**: 直近3曲のプレビュー・再生ボタン
- **サイドバー**: ユーザープロフィール・クイックアクション・天気ウィジェット

**リアルタイムデータ表示**:
- 経過時間（MM:SS形式）
- 現在距離（km/m自動切替）
- 現在速度・平均速度（km/h）
- GPS精度インジケーター
- 生成予定楽曲プレビュー

#### 3.2.2 音楽ライブラリ画面
**機能**: 生成楽曲の包括的管理・再生・分析

**主要機能**:
- **検索・フィルタリング**: タイトル・ジャンル・日付・ステータス
- **ソート機能**: 作成日時・タイトル・長さ・BPM
- **楽曲カード**: アルバムアート・メタデータ・再生ボタン・お気に入り
- **詳細表示**: 生成プロンプト・歩行データ・環境データ
- **統計表示**: 総楽曲数・完了済み・お気に入り数

**楽曲管理機能**:
- 再生・一時停止・音量調整
- お気に入り登録・解除
- ダウンロード・共有
- プレイリスト作成（将来実装）

#### 3.2.3 ユーザープロフィール画面
**ゲーミフィケーション要素の中心**:

**プロフィール情報**:
- ユーザー名・アバター
- 現在レベル・XP・次レベルまでの進捗
- 総統計（ウォーク数・楽曲数・総距離・総時間）
- 連続日数・最終ウォーキング日

**バッジ・称号システム**:
- 獲得バッジ一覧（レアリティ別表示）
- 現在の称号・利用可能称号
- 進捗中のバッジ・達成条件表示

**実績システム**:
- 距離系：初回1km、10km、100km、1000km
- 楽曲系：初回生成、10曲、50曲、100曲
- 継続系：3日連続、1週間、1ヶ月、1年
- 特殊系：早朝ウォーク、深夜ウォーク、雨天ウォーク

### 3.3 データ管理仕様

#### 3.3.1 ローカルストレージ戦略
**主要データ**:
- ユーザープロフィール・設定
- ウォーキング履歴（直近100回）
- 生成楽曲メタデータ
- バッジ・称号進捗

**ストレージ容量管理**:
- 音声ファイル：最大500MB（自動削除機能）
- メタデータ：無制限（軽量JSON）
- 画像キャッシュ：最大100MB

#### 3.3.2 データ同期・バックアップ
**クラウド同期**（将来実装）:
- Google Drive/iCloud連携
- 楽曲メタデータ同期
- 設定・プロフィール同期
- デバイス間データ移行

## 4. 非機能要件

### 4.1 パフォーマンス要件
- **初期ロード時間**: < 3秒（3G環境）
- **GPS位置更新**: 1秒間隔・遅延 < 500ms
- **音楽生成時間**: 30-120秒（Suno API依存）
- **UI応答性**: < 100ms（タップ・スワイプ）

### 4.2 セキュリティ要件
- **HTTPS必須**: 位置情報・API通信の暗号化
- **API Key管理**: 環境変数・サーバーサイド管理
- **位置情報**: ユーザー同意・最小限収集
- **データ保護**: ローカル暗号化・匿名化

### 4.3 互換性要件
- **ブラウザ**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **OS**: iOS 14+, Android 10+
- **画面サイズ**: 320px-2560px対応
- **PWA**: インストール可能・オフライン基本機能

### 4.4 アクセシビリティ要件
- **WCAG 2.1 AA準拠**
- **スクリーンリーダー対応**
- **キーボードナビゲーション**
- **高コントラストモード**
- **多言語対応**（日本語・英語）

## 5. API仕様

### 5.1 Suno AI API連携
```typescript
// 音楽生成リクエスト
POST https://api.suno.ai/v1/generate
Headers: {
  "Authorization": "Bearer {API_KEY}",
  "Content-Type": "application/json"
}
Body: {
  "prompt": string,
  "duration": 30 | 60 | 90,
  "genre": string,
  "mood": string,
  "bpm": number
}

// 生成状況確認
GET https://api.suno.ai/v1/jobs/{job_id}
Response: {
  "id": string,
  "status": "queued" | "generating" | "complete" | "failed",
  "audio_url"?: string,
  "image_url"?: string,
  "metadata"?: object
}
```

### 5.2 Geolocation API使用
```typescript
// 高精度位置取得設定
const options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 1000
};

// 継続的位置監視
navigator.geolocation.watchPosition(
  successCallback,
  errorCallback,
  options
);
```

## 6. 開発・運用計画

### 6.1 開発フェーズ
**Phase 1** (4週間): コア機能実装
- GPS トラッキング・基本UI
- ダッシュボード・プロフィール画面
- ローカルデータ管理

**Phase 2** (3週間): Suno AI連携
- API統合・音楽生成フロー
- 楽曲ライブラリ・再生機能
- エラーハンドリング・最適化

**Phase 3** (2週間): ゲーミフィケーション
- バッジ・称号システム
- 実績・レベルアップ機能
- UI/UX最終調整

**Phase 4** (1週間): PWA・最適化
- Service Worker実装
- パフォーマンス最適化
- テスト・デバッグ・デプロイ

### 6.2 品質保証
- **ユニットテスト**: Jest + React Testing Library
- **E2Eテスト**: Playwright
- **パフォーマンステスト**: Lighthouse CI
- **セキュリティテスト**: OWASP準拠

### 6.3 運用・監視
- **エラー監視**: Sentry
- **アナリティクス**: Google Analytics 4
- **パフォーマンス監視**: Web Vitals
- **API監視**: Suno AI使用量・エラー率

## 7. 将来拡張計画

### 7.1 短期拡張（3-6ヶ月）
- **ソーシャル機能**: 楽曲共有・コミュニティ
- **プレイリスト**: カスタムプレイリスト作成
- **詳細分析**: 歩行パターン分析・健康指標
- **音楽カスタマイズ**: ジャンル・ムード詳細設定

### 7.2 中期拡張（6-12ヶ月）
- **AI学習**: 個人嗜好学習・推奨システム
- **ウェアラブル連携**: Apple Watch・Fitbit統合
- **音声コントロール**: ハンズフリー操作
- **リアルタイム協調**: 友人との同期ウォーキング

### 7.3 長期ビジョン（1年以上）
- **AR/VR統合**: 没入型ウォーキング体験
- **健康プラットフォーム**: 医療・フィットネス連携
- **音楽配信**: 独自音楽プラットフォーム
- **グローバル展開**: 多言語・多地域対応

---

**文書バージョン**: 1.0  
**最終更新**: 2024年12月  
**作成者**: Development Team  
**承認者**: Product Owner