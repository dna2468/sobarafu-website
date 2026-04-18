# CLAUDE.md

Claude Code 向けの開発ガイド。このファイルはClaudeがこのリポジトリで作業する際のコンテキストとして読まれます。

## プロジェクト概要

**焼きそばスタンド らふ** の公式サイト。名古屋市南区・鶴里駅徒歩1分の焼きそば専門店。2026年5月7日（木）オープン予定。

- **公開URL**: https://sobarafu.rta.nagoya/
- **リポジトリ**: https://github.com/dna2468/sobarafu-website
- **デプロイ**: Cloudflare Pages（GitHub `main` 自動連携）

## リポジトリ構成

```
sobarafu-website/
├── index.html          # 1ページ構成のシングルページ
├── styles.css          # 外部CSS
├── script.js           # 外部JS（GSAP 制御・UI ロジック）
├── images/             # ヒーロー・店舗写真
├── logo-brand/         # ロゴ類（SVG + PNG）
├── menu-photos/        # メニュー写真
├── archive/            # 旧サイト・不要ファイル
│   ├── old-site/       # 旧 index.html / menu.html / 旧画像
│   └── docs/           # 旧 README / SESSION_LOG
├── CLAUDE.md           # このファイル
└── README.md
```

**重要**: 旧サイトは `archive/old-site/` にあります。現行サイトは外部 CSS/JS を使う構成で、旧サイト（インライン CSS、2ページ構成）とは別物です。旧サイトの記述をコピペ流用しないこと。

## アーキテクチャ

- **静的サイト**（ビルド不要）。`index.html` + `styles.css` + `script.js` の3点構成。
- **シングルページ** — ナビはアンカーリンクでページ内ジャンプ。
- **アニメーション**: GSAP 3.12 + ScrollTrigger を CDN から読込み。`prefers-reduced-motion` 対応（GSAPが無い時のフォールバックも `script.js` 内に実装済み）。
- **構造化データ**: JSON-LD で Restaurant schema と FAQPage schema を埋め込み済み。
- **アクセシビリティ**: Skip link、ARIA属性、セマンティック HTML。

### script.js の主な責務

- ヘッダーのスクロール時影付け
- スクロール進捗バー
- フローティング「OPEN」ディスクの表示/非表示
- Back to top ボタンの表示/非表示
- パララックス（data-parallax）
- 3D チルト（data-tilt）
- マグネットボタン（data-magnet）
- モバイルナビ開閉
- GSAP Reveal アニメーション（data-reveal-*）

### styles.css のデザイントークン

`:root` 変数で統一管理：
- **ブランドカラー**: `--c-red` `#C1272D`、`--c-brown` `#42210B`、`--c-orange` `#FFB800`、`--c-cta` `#FF6B35`
- **背景**: `--c-cream` `#FFFDF5`、`--c-butter` `#FFF8E7`、`--c-navy` `#1A1A2E`
- **テキスト**: `--c-ink` `#2D2D2D`、`--c-ink-soft` `#4a4a4a`
- **フォント**: `--f-display`（RocknRoll One）、`--f-heading`（Zen Maru Gothic）、`--f-body`（Zen Kaku Gothic New）
- **スペーシング**: `--radius-m` `18px`、`--radius-l` `28px`、`--header-h` `72px`、`--max-w` `1160px`

## セクション構成（index.html）

1. Hero（`<section class="hero">`）
2. Big Marquee A
3. News Ticker
4. Concept（`#concept`）
5. Story（`#story`）
6. Menu（`#menu`）
7. Instagram Gallery（`#gallery`）
8. Big Marquee B
9. Access（`#access`）
10. FAQ（`#faq`）
11. Contact（`#contact`）

## 開発時の注意

### 変更の流れ
1. ローカル編集 → プレビュー確認
2. `git add` → `git commit` → `git push origin main`
3. Cloudflare Pages が自動でビルド＆デプロイ

### ローカルプレビュー
```bash
npx --yes http-server -p 3000 -c-1
```
`.claude/launch.json` に定義済み。

### コミットメッセージ
日本語で簡潔に。既存の履歴に倣う。Co-Authored-By トレーラーで Claude を記載。

### 画像追加
- `menu-photos/` にメニュー写真
- `images/` に店舗・ヒーロー系
- `logo-brand/` にロゴ類
- ファイル名は日本語OK（URL エンコード済みで配信される）

### JSON-LD の更新
メニュー・FAQ・営業時間に変更があったら `index.html` 冒頭の 2つの `<script type="application/ld+json">` も必ず更新すること（SEO 重要）。

## 店舗情報（変更時の参照元）

- **住所**: 〒457-0004 愛知県名古屋市南区中江1-6-15 パックス鶴里1階
- **アクセス**: 地下鉄桜通線 鶴里駅 徒歩1分
- **電話**: 052-746-6386
- **メール**: info@rafu.rta.nagoya
- **営業時間**: 11:00–17:00（店内飲食は15:00まで／L.O. 店内15:00・テイクアウト16:30・なくなり次第終了）
- **定休日**: 日曜日・月曜日・祝日
- **席数**: カウンター8席
- **予約**: 不可（先着順）
- **テイクアウト**: 一部メニュー対応可
- **駐車場**: 現在、提携駐車場を調整中（近隣コインパーキング案内）
- **支払い**: 現金・クレジットカード・電子マネー・QRコード決済
- **Instagram**: @yakisoba.stand.rafu
- **オープン**: 2026.5.7（木）

## やらないこと

- ビルドツールの導入（静的ファイル構成を維持）
- 旧サイト（`archive/old-site/`）の編集（参照専用）
- Netlify 関連の設定（Cloudflare Pages 移行済み）

## 過去の開発経緯

`archive/docs/SESSION_LOG.md` に旧サイト時代の作業ログがあります。
現行サイトは外部業者への依頼サンプルをベースに構築されたもので、旧サイトとは別系統のコードベースです。
