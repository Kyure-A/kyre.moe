---
title: "Nix で Sheldon を使う"
description: "Sheldon は Zsh / Bash プラグインマネージャーです"
date: "2026-02-19"
tags:
  - "Sheldon"
  - "Zsh"
  - "Nix"
---


# はじめに

キュレェです。

[Sheldon](https://github.com/rossmacarthur/sheldon) は Toml を用いて設定する Zsh / Bash プラグインマネージャーです。

これを Nix 環境で使いたいとき、愚直にやるならば home-manager で plugins.toml を管理すればいいわけですが、home-manager を使って管理できるようになったのでご紹介します。

この変更は home-manager に俺が送った [PR](https://github.com/nix-community/home-manager/pull/5672) を引き継いでくれた [elanora96](https://github.com/elanora96) さんによって upstream に merge されています。オープンソースソフトウェアにおける暖かさ・自由さを知った一件でした。


# Sheldon を使うメリット


## Zsh に依存していない

Sheldon は他の Zsh プラグインマネージャとは違い、Rust のネイティブバイナリで実装されています。他のプラグインマネージャーは Zsh Script がほとんどであるため、Zsh 依存かつ Zsh の起動時に評価されるオーバーヘッドが生じます。

しかし、Sheldon は Zsh に stdout 経由でプラグインを与えるだけであるため、これを Zsh が評価するだけで Zsh 側はプラグインを読み込むことができます。


## テンプレートエンジン

[Sheldon の examples](https://sheldon.cli.rs/Examples.html) には `zsh-defer` を用いたプラグインの遅延ロードについてのテンプレートが書かれています。これは事実上 Sheldon ユーザーはデフォルトで使うものですが、これが Sheldon に組み込まれておらずユーザー側が定義するものという前提で examples に置かれているのは以下のような思想があるからだと邪推します:

-   特定の実装に依存しない
    
    現在は `zsh-defer` が Zsh におけるプラグイン遅延ロードの主流ですが、主流が入れ替わった場合・ユーザーが別のメソッドを使いたい場合にもテンプレートを入れ替えるだけで容易に対応することができる

-   Sheldon が Zsh 依存ではない
    
    `zsh-defer` は Zsh 向けだが、Bash 向けの設定ならば当然別の実装を使う必要がある。Sheldon 側でそれをラップするのではなくユーザーがテンプレートを利用するだけで使い分けることができる


## 宣言的な設定

例えば Zsh プラグインマネージャの一つである Zinit (妙にリポジトリの owner がインド人みたいな名前だったことだけ覚えている) については

```zsh
zinit ice wait lucid atload'...'
zinit light zsh-users/zsh-syntax-highlighting
```

のように命令的な設定を `.zshrc` に記述してプラグインを読みこんでいます。

一方 Sheldon は素で用いるならば Toml, home-manager で設定するなら Nix で宣言的にプラグインを読み込むことができます。`.zshrc` には `eval "$(sheldon source)` を書くだけでよいです。

```
[plugins.zsh-syntax-highlighting]
github = "zsh-users/zsh-syntax-highlighting"
apply = ["defer"]
```

ローカルパスも指定できるので、Nix Store に置かれているプラグインを指定することもできます。

```
[plugins.zsh-syntax-highlighting]
local = "/nix/store/xxxxx-source"
apply = ["defer"]
```


# Sheldon を Nix で使う


## home-manager の `programs.sheldon`

はじめにで述べたとおり、home-manager には `programs.sheldon` モジュールがあり、`programs.sheldon.settings` に attrset を書くとそのまま `plugins.toml` として生成してくれます。

```nix
programs.sheldon = {
  enable = true;
  settings = {
    shell = "zsh";
    plugins = {
      zsh-syntax-highlighting = {
        github = "zsh-users/zsh-syntax-highlighting";
        apply = [ "defer" ];
      };
    };
    templates = {
      defer = ''
        {{ hooks | get: "pre" | nl }}{% for file in files %}zsh-defer source "{{ file }}"
        {% endfor %}{{ hooks | get: "post" | nl }}'';
    };
  };
};
```

Nix の式として書けるので、変数展開や条件分岐がそのまま使えるのがうれしいところです。


## プラグインのソースを Nix で管理する

Sheldon の `local` ソースを使えばプラグインの取得を Nix に委ねることができます。flake input として宣言した path をそのまま渡すだけです。

```nix
inputs.fast-syntax-highlighting = {
  url = "github:zdharma-continuum/fast-syntax-highlighting";
  flake = false;
};
```

```nix
plugins.fast-syntax-highlighting = {
  local = "${fast-syntax-highlighting}"; # -> /nix/store/xxxx-source
  apply = [ "defer" ];
};
```

こうするとプラグインのバージョンは `flake.lock` で管理され、Sheldon は Nix Store のディレクトリを読んでテンプレートに流し込むだけの役割になります。


## `inline` プラグインとの組み合わせ

`inline` ソースを使うと一行のシェルスクリプトもプラグインとして管理できます。

```nix
plugins = {
  compinit = {
    inline = "autoload -U compinit && zsh-defer compinit -C";
  };
  zsh-completions = {
    inline = "fpath+=${zsh-completions}/src";
  };
  zoxide = {
    inline = ''zsh-defer eval "$(zoxide init zsh)"'';
  };
};
```

`.zshrc` にばらばらに書いていたものがすべて plugins テーブルに集約されるので、何が読み込まれているのかを attrset だけで把握できるようになります。


## `zsh-defer` の読み込み順に注意する

`zsh-defer` は Sheldon のプラグインとしてではなく、`.zshrc` の先頭で Sheldon より前に source しておく必要があります。defer テンプレートが `zsh-defer` コマンドを呼ぶので、`sheldon source` の時点で利用可能でなければなりません。

```nix
{ pkgs }:
let
  load-zsh-defer = ''source "${pkgs.zsh-defer}/share/zsh-defer/zsh-defer.plugin.zsh"'';
  load-sheldon = ''eval "$(sheldon source)"'';
in
{
  programs.zsh = {
    enable = true;
    initContent = pkgs.lib.mkBefore (builtins.concatStringsSep "\n" [
      load-zsh-defer
      load-sheldon
    ]);
  };
}
```

`mkBefore` で `.zshrc` の先頭に配置して、`zsh-defer` → `sheldon source` の順を保証しています。これをミスすると defer されたプラグインが全部 `command not found` になるので注意してください（一敗）


## `github` ソースから flake inputs への移行

ここまでの例では Sheldon の `github` ソースと `local` ソースを並列に紹介してきましたが、実際に俺が最初に書いていた設定は `github` ソースを使ったものでした。

```nix
plugins.zsh-syntax-highlighting = {
  github = "zsh-users/zsh-syntax-highlighting";
  apply = [ "defer" ];
};
```

これは動くのですが、プラグインの取得を Sheldon に任せているので Nix の管理外になります。`sheldon lock` で生成されるロックファイルは Nix Store の外にあり、再現性の面では flake の恩恵を受けられていません。

これを flake inputs に移行するには、各プラグインを `flake = false` の input として宣言し、`github` を `local` に書き換えるだけです。

```nix
# flake.nix
inputs.zsh-syntax-highlighting = {
  url = "github:zsh-users/zsh-syntax-highlighting";
  flake = false;
};
```

```nix
plugins.zsh-syntax-highlighting = {
  local = "${zsh-syntax-highlighting}"; # github → local に変更
  apply = [ "defer" ];
};
```

しかし、プラグインの数だけルートの `flake.nix` に inputs が増えていきます。Sheldon 以外の inputs もあるのでこれは結構つらくなります。


## Sheldon モジュールを子 flake に分離する

そこで Sheldon モジュールごと子 flake に切り出しました。子 flake は独自の `flake.nix` と `flake.lock` を持つので、プラグイン用の inputs をルート flake から分離できます。

```nix
# inputs/sheldon/flake.nix
{
  description = "Sheldon Plugins";
  inputs = {
    zsh-syntax-highlighting = {
      url = "github:zsh-users/zsh-syntax-highlighting";
      flake = false;
    };
    zsh-completions = {
      url = "github:zsh-users/zsh-completions";
      flake = false;
    };
    # ... 他のプラグイン
  };
  outputs = { self, zsh-syntax-highlighting, zsh-completions, ... }: {
    homeManagerModules.default = { ... }@args:
      import ./default.nix (args // {
        inherit zsh-syntax-highlighting zsh-completions;
      });
  };
}
```

ルートの `flake.nix` からは `path:` で参照するだけです。

```nix
# flake.nix
inputs.sheldon.url = "path:./inputs/sheldon";
```

```nix
# modules/home/default.nix
imports = [
  inputs.sheldon.homeManagerModules.default
];
```

こうすることで、プラグインの追加・削除・バージョン更新が子 flake 内で完結し、ルート flake の `flake.lock` を汚さずに済むようになりました。外部入力を多く持つモジュールを子 flake に切り出すパターンは Sheldon 以外にも応用できると思います。


# まとめ

-   Sheldon はソースの取得とソースの適用が分離された設計になっているから Nix と相性が元々よかったよ！
-   home-manager で使えるようになったからおすすめだよ！

ありがとうございました。


# 余談

この記事がヒットしそうな検索ワードとして `Nix Sheldon` とかそういうのがありそうですが、世の中には [Sheldon Nix](https://www.eastern.edu/sheldon-nix) さんがいるらしいです。すごい名前。


# Reference

この記事で紹介した設定は俺の Nix 設定 ([Kyure-A/nix-config](https://github.com/Kyure-A/nix-config)) で実際に使っているものです。

-   [inputs/sheldon/](https://github.com/Kyure-A/nix-config/tree/master/inputs/sheldon) - Sheldon の子 flake（プラグイン定義・モジュール本体）
-   [inputs/sheldon/flake.nix](https://github.com/Kyure-A/nix-config/blob/master/inputs/sheldon/flake.nix) - プラグインの flake inputs
-   [inputs/sheldon/default.nix](https://github.com/Kyure-A/nix-config/blob/master/inputs/sheldon/default.nix) - Sheldon の home-manager モジュール
-   [modules/home/programs/zsh/default.nix](https://github.com/Kyure-A/nix-config/blob/master/modules/home/programs/zsh/default.nix) - `zsh-defer` と `sheldon source` の読み込み
-   [flake.nix](https://github.com/Kyure-A/nix-config/blob/master/flake.nix) - ルート flake（子 flake の参照）

