---
title: "Using Sheldon with Nix"
description: "Sheldon is a Zsh / Bash plugin manager"
date: "2026-02-19"
tags:
  - "Sheldon"
  - "Zsh"
  - "Nix"
---
> [!NOTE]
> This article was translated from Japanese by Claude Opus 4.6.


# Introduction

Hi, I'm Kyure\_A!

[Sheldon](https://github.com/rossmacarthur/sheldon) is a Zsh / Bash plugin manager configured using TOML.

When you want to use it in a Nix environment, the naive approach would be to manage `plugins.toml` with home-manager. However, it can now be managed properly through home-manager, so let me introduce how.

This change was merged upstream by [elanora96](https://github.com/elanora96), who took over the [PR](https://github.com/nix-community/home-manager/pull/5672) I originally submitted to home-manager. It was an experience that showed me the warmth and openness of open-source software.


# Benefits of Using Sheldon


## Not Dependent on Zsh

Unlike other Zsh plugin managers, Sheldon is implemented as a native Rust binary. Most other plugin managers are written in Zsh Script, making them dependent on Zsh and adding overhead as they are evaluated during Zsh startup.

Sheldon, on the other hand, simply passes plugins to Zsh via stdout, so Zsh only needs to evaluate that output to load the plugins.


## Template Engine

[Sheldon's examples](https://sheldon.cli.rs/Examples.html) include templates for lazy-loading plugins using `zsh-defer`. This is effectively something that all Sheldon users use by default, but I suspect the reason it's placed in the examples &#x2013; with the premise that users define it themselves rather than having it built into Sheldon &#x2013; is based on the following philosophy:

-   No dependency on a specific implementation
    
    Currently `zsh-defer` is the mainstream approach for lazy-loading Zsh plugins, but if the mainstream shifts or a user wants to use a different method, they can easily adapt by simply swapping out the template.

-   Sheldon is not Zsh-dependent
    
    `zsh-defer` is designed for Zsh, but for Bash configurations you would naturally need a different implementation. Rather than Sheldon wrapping this internally, users can simply switch between implementations by using templates.


## Declarative Configuration

For example, with Zinit, one of the Zsh plugin managers (the only thing I remember about it is that the repository owner had an Indian-sounding name for some reason):

```zsh
zinit ice wait lucid atload'...'
zinit light zsh-users/zsh-syntax-highlighting
```

You write imperative configuration in `.zshrc` to load plugins.

Sheldon, on the other hand, lets you declaratively load plugins using TOML when used standalone, or Nix when configured through home-manager. You only need to write `eval "$(sheldon source)"` in your `.zshrc`.

```
[plugins.zsh-syntax-highlighting]
github = "zsh-users/zsh-syntax-highlighting"
apply = ["defer"]
```

You can also specify local paths, so you can point to plugins stored in the Nix Store.

```
[plugins.zsh-syntax-highlighting]
local = "/nix/store/xxxxx-source"
apply = ["defer"]
```


# Using Sheldon with Nix


## home-manager's `programs.sheldon`

As mentioned in the introduction, home-manager has a `programs.sheldon` module. Writing an attrset in `programs.sheldon.settings` generates the corresponding `plugins.toml`.

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

Since it's written as a Nix expression, you can use variable interpolation and conditional branching directly, which is a nice benefit.


## Managing Plugin Sources with Nix

By using Sheldon's `local` source, you can delegate plugin fetching to Nix. Simply pass the path declared as a flake input directly.

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

This way, plugin versions are managed by `flake.lock`, and Sheldon's role is reduced to simply reading directories from the Nix Store and feeding them into templates.


## Combining with `inline` Plugins

Using the `inline` source, you can manage even single-line shell scripts as plugins.

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

Everything that was scattered across your `.zshrc` is consolidated into the plugins table, so you can understand what's being loaded just by looking at the attrset.


## Be Careful with `zsh-defer` Load Order

`zsh-defer` needs to be sourced at the top of `.zshrc`, before Sheldon, rather than being loaded as a Sheldon plugin. Since the defer template calls the `zsh-defer` command, it must be available at the point when `sheldon source` runs.

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

`mkBefore` places it at the top of `.zshrc`, ensuring the order `zsh-defer` -> `sheldon source`. If you get this wrong, all deferred plugins will result in `command not found`, so be careful (learned this the hard way).


## Migrating from `github` Sources to Flake Inputs

The examples so far have presented Sheldon's `github` and `local` sources side by side, but the configuration I actually started with used the `github` source.

```nix
plugins.zsh-syntax-highlighting = {
  github = "zsh-users/zsh-syntax-highlighting";
  apply = [ "defer" ];
};
```

This works, but plugin fetching is left to Sheldon, so it falls outside of Nix's management. The lock file generated by `sheldon lock` lives outside the Nix Store, so you don't get the reproducibility benefits of flakes.

To migrate to flake inputs, you simply declare each plugin as a `flake = false` input and replace `github` with `local`.

```nix
# flake.nix
inputs.zsh-syntax-highlighting = {
  url = "github:zsh-users/zsh-syntax-highlighting";
  flake = false;
};
```

```nix
plugins.zsh-syntax-highlighting = {
  local = "${zsh-syntax-highlighting}"; # github -> local
  apply = [ "defer" ];
};
```

However, the root `flake.nix` gains another input for every plugin you add. Combined with non-Sheldon inputs, this gets painful quickly.


## Extracting the Sheldon Module into a Sub-Flake

To address this, I extracted the entire Sheldon module into a sub-flake. A sub-flake has its own `flake.nix` and `flake.lock`, so plugin inputs can be isolated from the root flake.

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
    # ... other plugins
  };
  outputs = { self, zsh-syntax-highlighting, zsh-completions, ... }: {
    homeManagerModules.default = { ... }@args:
      import ./default.nix (args // {
        inherit zsh-syntax-highlighting zsh-completions;
      });
  };
}
```

From the root `flake.nix`, you simply reference it with `path:`.

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

This way, adding, removing, or updating plugin versions is self-contained within the sub-flake, without polluting the root flake's `flake.lock`. I think this pattern of extracting modules with many external inputs into sub-flakes can be applied beyond just Sheldon.


# Conclusion

-   Sheldon's design separates source fetching from source application, which makes it inherently compatible with Nix.
-   It's now available in home-manager, so I highly recommend it.

Thank you for reading!


# Aside

If you search for something like "Nix Sheldon" to find this article, you might also stumble upon [Sheldon Nix](https://www.eastern.edu/sheldon-nix), who is apparently a real person. What a name.


# Reference

The configurations introduced in this article are from my Nix configuration ([Kyure-A/nix-config](https://github.com/Kyure-A/nix-config)).

-   [inputs/sheldon/](https://github.com/Kyure-A/nix-config/tree/master/inputs/sheldon) - Sheldon sub-flake (plugin definitions and module)
-   [inputs/sheldon/flake.nix](https://github.com/Kyure-A/nix-config/blob/master/inputs/sheldon/flake.nix) - Plugin flake inputs
-   [inputs/sheldon/default.nix](https://github.com/Kyure-A/nix-config/blob/master/inputs/sheldon/default.nix) - Sheldon home-manager module
-   [modules/home/programs/zsh/default.nix](https://github.com/Kyure-A/nix-config/blob/master/modules/home/programs/zsh/default.nix) - Loading `zsh-defer` and `sheldon source`
-   [flake.nix](https://github.com/Kyure-A/nix-config/blob/master/flake.nix) - Root flake (sub-flake references)

