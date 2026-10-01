import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig, median, parseArgs } from "./lib.mjs";

const config = await loadConfig(parseArgs());
const read = async (name) =>
  JSON.parse(await readFile(resolve(config.outputDirectory, name), "utf8"));
const builds = await read("builds.json");
const browser = await read("browser.json");
const common = await read("common.json");
if (
  !builds.complete ||
  !browser.complete ||
  [...builds.samples, ...browser.samples, ...browser.navigationSamples].some(
    (sample) => !sample.success,
  )
) {
  throw new Error("Complete, valid measurements are required for conclusions.");
}
const ids = builds.variants.map((variant) => variant.id);
const route = "/ja/blog/sheldon-nix";
const page = (id, path, key) =>
  median(
    browser.samples
      .filter((sample) => sample.variant === id && sample.route === path)
      .map((sample) => sample.metrics[key]),
  );
const build = (id, mode) =>
  median(
    builds.samples
      .filter((sample) => sample.variant === id && sample.mode === mode)
      .map((sample) => sample.elapsedMs),
  );
const nav = (id) =>
  browser.navigationSamples
    .filter((sample) => sample.variant === id)
    .map((sample) => sample.elapsedMs);
const seconds = (ms) => `${(ms / 1000).toFixed(2)}秒`;
const bytes = (value) => `${(value / 1024).toFixed(1)} KiB`;
const row = (label, value) => `| ${label} | ${ids.map(value).join(" | ")} |`;
const lines = [
  "# kyre.moe：Next・TanStack Start・rshono 実測比較",
  "",
  "このサイトではビルド時間はTanStack Start、初回表示と転送量はrshonoが有利でした。Startへ移る判断は妥当ですが、ブラウザ表示がNextより速くなるという結果ではありません。rshonoは初期ロードを重視する選択肢で、GitHub Pages向けのRSC配信アダプターを今回追加しています。",
  "",
  "## 測定結果",
  "",
  `同じ${common.posts}記事・${common.publicPages}公開ページ・OGP・画像を使っています。全${builds.samples.length}回のビルド、${browser.samples.length}回のページ表示、${browser.navigationSamples.length}回のクリックが成功しました。以下は中央値です。`,
  "",
  `| 指標 | ${builds.variants.map((variant) => variant.label).join(" | ")} |`,
  "| --- | ---: | ---: | ---: |",
  row("ビルド：フレームワークキャッシュ削除", (id) =>
    seconds(build(id, "cold")),
  ),
  row("ビルド：キャッシュ保持", (id) => seconds(build(id, "warm"))),
  row("Home LCP", (id) => seconds(page(id, "/ja", "lcpMs"))),
  row("日本語記事 LCP", (id) => `${Math.round(page(id, route, "lcpMs"))} ms`),
  row("日本語記事 初期JS（gzip）", (id) =>
    bytes(page(id, route, "jsEncodedBytes")),
  ),
  row("日本語記事 全転送ボディ", (id) =>
    bytes(page(id, route, "totalEncodedBytes")),
  ),
  row(
    "一覧→記事 DOM ready＋2フレーム",
    (id) => `${Math.round(median(nav(id)))} ms`,
  ),
  row(
    "クリックの最小〜最大",
    (id) =>
      `${Math.round(Math.min(...nav(id)))}〜${Math.round(Math.max(...nav(id)))} ms`,
  ),
  row("Home CLS", (id) => page(id, "/ja", "cls").toFixed(3)),
  "",
  "LCPは主要コンテンツの描画時刻、CLSはレイアウトずれの指標です。ブログでは全3版ともCLSがゼロでした。HomeではrshonoのCLSがやや大きく、記事の長い処理によるブロック時間もrshonoが常に最小という結果ではありません。",
  "",
  "クリックは全15回ともページ再読み込みのない遷移でした。先読みは各実装の設定のまま有効です。中央値ではrshonoが速いものの、205〜694 msとばらつくため、わずかな中央値差で遷移性能全体を断定するには足りません。この値は本文がDOMに存在するまでの時間で、視覚的なトランジション完了やINPではありません。",
  "",
  "![ビルド・LCP・HTML/JS/CSSの比較](comparison.png)",
  "",
  "## 条件と解釈",
  "",
  `測定日時：${browser.environment.recordedAt}。${browser.environment.cpuModel}、${browser.environment.logicalCpuCount}コア、${Math.round(browser.environment.memoryBytes / 1024 ** 3)} GiB、Node ${browser.environment.nodeVersion}、Chrome ${browser.environment.chromeVersion}。`,
  "",
  `ビルドは各条件${builds.config.buildRepetitions}回、ページ・クリックは各${browser.config.browserRepetitions}回。ブラウザはCPU ${browser.config.profile.cpuSlowdown}倍スロットル、下り${((browser.config.profile.downloadBytesPerSecond * 8) / 1e6).toFixed(1)} Mbps、遅延${browser.config.profile.latencyMs} ms、${browser.config.viewport.width}×${browser.config.viewport.height}。新しいブラウザコンテキスト、同じgzip静的サーバー、外部埋め込み通信なしで${browser.config.observationWindowMs / 1000}秒観測しました。公開環境の実ユーザー統計ではありません。`,
  "",
  "ビルド計測には各フレームワークのproduction buildと必要な静的出力整形を含め、共通の記事・OGP生成は別に測っています。Nextは標準の型検査込み、Vite/Rspackは型検査なしです。型検査は別途全3版で通しています。純粋なコンパイラ速度の比較とは区別してください。coldでも依存パッケージとOSファイルキャッシュは保持しています。Start/rshonoではproductionの永続コンパイラキャッシュが作られず、warmの短縮はほぼありません。",
  "",
  `共通準備はキャッシュなし${seconds(common.measurements[0].milliseconds)}、あり${seconds(common.measurements[1].milliseconds)}（各1回）でした。サイト全体の待ち時間にはこの処理も加わります。フレームワーク変更だけで全体が4倍速くなるとはいえません。`,
  "",
  "初期JSだけでなくHTML内のRSC/JSON、CSS、フォント、追加のRSC取得も全転送ボディへ含めています。これはメイン文書とメインフレームで観測した同一オリジンの完了済みHTTPボディで、ヘッダーを除きます。今回subframeはありません。グラフの3段目はHTML＋JS＋CSSだけなので、全転送量は表を参照してください。Homeは画像が約2.25 MiBを占め、フレームワークの差より大きい負荷です。",
  "",
  "フォントは全3版で別ファイル配信に統一しました。rshono既定設定の未使用フォント埋め込み約105 KiBを除き、Viteの小さいフォントもインライン化しない設定です。変更前の診断データは別フォルダーに保存し、最終集計へ混ぜていません。設定を整えた実アプリ同士の比較です。",
  "",
  "## 実装と再現",
  "",
  "Next 16.3.6、TanStack Start 1.168.60、rshono 1.0.0-rc.23です。アプリ依存のReact/React DOMは19.3.0に揃えていますが、Next App Routerは内蔵19.3.0-canaryを使います。rshono upstreamの開発・テスト用依存は19.2.8で、今回の19.3.0との組合せはこのサイトのビルドとブラウザで検証したものです。各フレームワーク固有ランタイムの違いは保持しています。",
  "",
  "rshono版はHTML＋Flightを静的に出力し、GitHub Pagesで動くようRSCリクエストをindex.rscへ向けるアダプターを追加しました。サーバーSSRの処理性能は今回の対象にしていません。",
  "",
  ...builds.variants.map((variant) => `- ${variant.label}：${variant.root}`),
  "",
  "[全指標と測定方法](report.md)、[実行コマンド](../README.md)、[ソース差分・SHA manifest](source/manifest.json)、[生データ](browser.json)。",
  "",
  "検証：全66ページの静的HTML・metadata・OGP・404・sitemap、日英記事本文、型検査、lint。rshonoはFirefoxで言語切替・タグ・404・ソフト遷移、開発サーバーのHTML/Flight応答、Storybook production buildも確認しました。",
  "",
];
await writeFile(
  resolve(config.outputDirectory, "summary-ja.md"),
  `${lines.join("\n")}\n`,
);
console.log("Saved Japanese comparison summary.");
