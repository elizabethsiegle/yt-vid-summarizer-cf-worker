This app hosted on [Cloudflare Workers](https://workers.cloudflare.com/) uses Llama 3.1 hosted on [Workers AI](https://ai.cloudflare.com) and this [OS JS Youtube Transcript library](https://github.com/Kakulukian/youtube-transcript) to summarize a transcription of an input YouTube video. The transcription is uploaded to [Cloudflare KV](https://developers.cloudflare.com/kv/get-started/) 

Clone the repo locally.

Install

```
npm install
```

Build

```
npx wrangler dev
```

Deploy

```
npx wrangler deploy
```
