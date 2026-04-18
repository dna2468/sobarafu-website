# 焼きそばスタンド らふ 公式サイト

https://sobarafu.rta.nagoya/

名古屋市南区・鶴里駅徒歩1分の焼きそば専門店「焼きそばスタンド らふ」の公式ウェブサイトです。
2026年5月7日（木）グランドオープン予定。

## ファイル構成

```
sobarafu-website/
├── index.html              # 1ページ構成のトップ
├── styles.css              # スタイルシート
├── script.js               # GSAP アニメーション・UI ロジック
├── images/
│   └── 店舗外観.jpg        # ヒーロー・店舗写真
├── logo-brand/
│   ├── ra-pattern.png      # 「ら」マーク（favicon）
│   ├── rafu-logo.svg       # ロゴ一式
│   ├── rafu-logo-mono.svg
│   ├── rafu-logo-rafu.svg
│   ├── rafu-logo-rafu-white.svg
│   └── rafu-logo-stand.svg
├── menu-photos/
│   ├── ソース焼きそば.jpg
│   ├── すじこん焼きそば.jpg
│   ├── 旨辛ホルモン焼きそば.jpg
│   ├── 名古屋風あんかけ焼きそば.jpg
│   ├── ソース焼きそば_目玉焼きトッピング_.jpg
│   ├── 焼きそばパン_2個セット_.jpg
│   └── ごはん.jpg
├── archive/                # 旧サイト・参考資料
│   ├── old-site/           # 旧 index.html / menu.html / 旧画像一式
│   └── docs/               # 旧 README / SESSION_LOG
├── CLAUDE.md               # Claude Code 向け開発ガイド
└── README.md
```

## セクション構成

1. **Hero** — オープン告知・キャッチコピー・メイン写真
2. **Concept** — こだわり（茹で麺への訴求）
3. **Story** — 店舗ストーリー
4. **Menu** — メニュー一覧（写真付き）
5. **Instagram Gallery** — 公式インスタ埋め込み
6. **Access** — 地図・店舗情報
7. **FAQ** — よくある質問（JSON-LD 付き）
8. **Contact** — お問い合わせ

## 技術スタック

- 静的 HTML / CSS / JS（ビルド不要）
- フォント: Google Fonts（RocknRoll One / Zen Maru Gothic / Zen Kaku Gothic New）
- アニメーション: GSAP 3.12 + ScrollTrigger（CDN）
- 構造化データ: JSON-LD（Restaurant schema + FAQPage schema）
- 画像埋め込み: Instagram oEmbed

## デプロイ

Cloudflare Pages + GitHub 連携による自動デプロイ。
`main` ブランチへの push で自動公開されます。

## ローカル開発

```bash
# .claude/launch.json に定義済み
npx http-server -p 3000 -c-1
```

## 店舗情報

- **住所**: 〒457-0004 愛知県名古屋市南区中江1-6-15 パックス鶴里1階
- **アクセス**: 名古屋市営地下鉄桜通線 鶴里駅 徒歩1分
- **営業時間**: 11:00 – 17:00（L.O. 16:30）
- **定休日**: 日曜日・月曜日・祝日
- **席数**: カウンター8席
- **電話**: 052-746-6386
- **Instagram**: [@yakisoba.stand.rafu](https://www.instagram.com/yakisoba.stand.rafu/)
