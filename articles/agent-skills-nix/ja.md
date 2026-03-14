---
title: "Nix で Agent Skills を管理する"
description: "Nix を用いた Agent Skills 設定のためのフレームワークを開発しました"
date: "2025-12-24"
tags: 
  - "nix"
  - "agentskills"
  - "codex"
  - "claudecode"
---

## はじめに
Model Context Protocol だなんだと言っていた時期ももう懐かしく、今となってはコンテキストウィンドウの関係から、多くの MCP Server を入れることは主流ではなくなってきたように見えます。

そうした背景の中で、10 月に Agent Skills なるものが Anthropic から発表され、12 月 18 日にオープンな規格となりました。ここ一週間ずっと驚き屋が驚いててやかましかったですね。

https://platform.claude.com/docs/ja/agents-and-tools/agent-skills/overview


MCP Server についてはすでに Nix を用いて宣言的に管理する手法が存在しますが、まだ Agent Skills について Nix で管理する手法は見当たらないように思えました。非 Nix での手法としては OpenSkills なるものがあるらしいです。詳しくは調べる気になりませんでした（Nix ではないので）

https://github.com/numman-ali/openskills


そのため、Nix を用いた Agent Skills 設定のためのフレームワークである [agent-skills-nix](https://github.com/Kyure-A/agent-skills-nix) を作成しました。

https://github.com/Kyure-A/agent-skills-nix

## なぜ Nix？
Nix で Agent Skills を管理する最大の利点は、Nix Flake による環境の固定と home-manager による宣言的な設定です。どの Agent Skills をどのエージェントに入れるかを設定で固定できるため、環境を増やす・再構築しても同じ状態を再現でき、将来の更新や悪意ある差し替えにも強くなります。

Agent Skills で LLM に悪意のある動作をさせることができるのかはさておき、警戒することに越したことはありません。Nix Flake で commit 単位でロックしておけば、未来の commit において悪意のあるプロンプトに差し替えられたとしても問題ありません。

また、複数リポジトリから提供される Agent Skills の統合ができたり、エージェントの設定ファイルごとの配置も一箇所で完結するので、運用がシンプルになります。

......という建前を連ねましたが、実際は home-manager ですべての設定を管理しているため、Agent Skills についても一元管理したいという邪心 - Driven Development です。

## 実装
MCP Server とは違い、Agent Skills は単なるテキストファイルとそれに付随するスクリプトがあるだけですから、単に各エージェントごとのディレクトリにシンボリックリンクを貼ってやればよさそうです。
最初はすべてのエージェントについてシンボリックリンクですべて配置する想定でしたが、Codex については実体がなければ Agent Skills を読み込んでくれないらしく、実体を配置するオプションも実装しました。

## 設定ファイル
この手の先駆者である [mcp-servers-nix](https://zenn.dev/natsukium/articles/f010c1ec1c51b2#%E8%A8%AD%E5%AE%9A%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E4%BD%9C%E6%88%90%E3%81%A8%E3%83%93%E3%83%AB%E3%83%89) は NixOS や home-manager などのシステム構成フレームワークに依存していないのが特徴ですが、agent-skills-nix については home-manager にしっかり依存しています。

Agent Skills のリポジトリがたくさん config の Nix Flake の inputs に並ぶのは気持ち悪いので、子ディレクトリに `flake.nix` と `default.nix` を作り、子供の Nix Flake を親の Nix Flake が inputs に入れる形式にして依存関係を分離しています。
`AGENTS.md` / `CLAUDE.md` などの指示用のファイルについては悩んでいて、Agent Skills ではないしな......と思い、まだ配置機能は実装していません。

```nix:flake.nix
{
  description = "Agent Skills";

  inputs = {
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    anthropic-skills = {
      url = "github:anthropics/skills";
      flake = false;
    };
    my-skills = {
      url = "github:Kyure-A/skills";
      flake = false;
    };
  };

  outputs =
    {
      self,
      agent-skills,
      anthropic-skills,
      my-skills,
      ...
    }:
    {
      homeManagerModules.default =
        { ... }@args: import ./ (args // { inherit agent-skills anthropic-skills my-skills; });
    };
}
```

```nix:default.nix
{
  lib,
  agent-skills,
  anthropic-skills,
  my-skills,
  ...
}:
{
  imports = [
    (import "${agent-skills.outPath}/modules/home-manager/agent-skills.nix" {
      inherit lib;
      inputs = { };
    })
  ];

  programs.agent-skills = {
    enable = true;
    sources = {
      anthropic = {
        path = anthropic-skills;
        subdir = "skills";
      };
      personal = {
        path = my-skills;
      };
    };
    skills.enable = [
      "frontend-design"
      "skill-creator"
    ];
    skills.enableAll = [ "personal" ];
    targets = {
      codex = {
        dest = ".codex/skills";
        structure = "copy-tree";
      };
      claude = {
        dest = ".claude/skills";
        structure = "copy-tree";
      };
    };
  };
}
```

`sources` は Agent Skills の取得元です。

`subdir` は SKILL.md が並ぶディレクトリで、anthropics/skills の場合は root からみた `"skills"` ディレクトリです。 

`skills.enable` は許可リストとなっていて、`skills.enableAll` は true ですべてのリポジトリについてすべての Agent Skills を有効化でき、あるいは `["personal"]` のようにリポジトリ単位ですべての Skills を有効化するショートカットです。

`targets` で配置先を決め、`dest` は `$HOME` との相対パスで指定し、`structure` として `link`/`symlink-tree`/`copy-tree` を選びます。Codex のように実体が必要なエージェントについては `copy-tree` が無難です。

## まとめ
- Agent Skills を Nix Flake でピン留めして、将来の差し替えや悪意ある変更に強くできるよ！
- home-manager で Agent Skills を宣言的に管理できるよ！
- 既存の Agent Skills リポジトリをそのまま束ねられるので、複数ソースの統合が楽だよ！
- ただし home-manager 依存であり、`AGENTS.md` の生成/更新は別途行う必要があるよ！

## おわりに
半年前くらいまでは LLM が Nix を書くのは難しそうでしたが、今となっては `gpt-5.2-codex xhigh` がほとんど作ってくれて進歩を感じています。
まだ執筆時点だと作って 2 日目くらいの発展途上なフレームワークなので、issue や Pull Request のほうぜひお待ちしております。
https://github.com/Kyure-A/agent-skills-nix
