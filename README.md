# Sveltekit + Arctic + Drizzle ORM を使用したGoogle OIDCの例

このリポジトリは https://github.com/lucia-auth/example-sveltekit-google-oauth をフォークし、ORM に Drizzle、レートリミットに Redis を導入したものです。

## プロジェクト初期設定(開発時)

- 環境変数の設定

プロジェクトルートに .env ファイルを作成し、以下を記述してください:

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DATABASE_URL="file:./dev.db" #SQLiteを使用する場合の例
REDIS_HOSTNAME="localhost" #redisのホスト名
REDIS_PORT=6379 #redisのポート番号
```

- コンテナの起動
  redis, serverless-redis-httpサービスを起動します。

```bash
docker compose up
```

- Drizzle マイグレーションの実行

```bash
npx drizzle-kit push:sqlite
```

## Cloudflare Workers へのデプロイ

Cloudflare Workers にデプロイするには次の手順を実行します:

```bash
pnpm add -D @sveltejs/adapter-cloudflare wrangler
pnpm run build
pnpm run deploy
```

`wrangler.toml` の `[vars]` セクションに環境変数を設定してください。
