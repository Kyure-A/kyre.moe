{
  description = "kyre.moe";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    anthropic-skills = {
      url = "github:anthropics/skills";
      flake = false;
    };
    next-skills = {
      url = "github:vercel-labs/next-skills";
      flake = false;
    };
    ui-skills = {
      url = "github:ibelick/ui-skills";
      flake = false;
    };
  };

  outputs =
    { nixpkgs, agent-skills, anthropic-skills, next-skills, ui-skills, ... }:
    let
      eachSystem =
        f:
        nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (
          system: f nixpkgs.legacyPackages.${system}
        );

      agentLib = agent-skills.lib.agent-skills;

      sources = {
        anthropic-skills = {
          path = anthropic-skills;
          subdir = "skills";
        };
        next-skills = {
          path = next-skills;
          subdir = "skills";
        };
        ui-skills = {
          path = ui-skills;
          subdir = "skills";
        };
      };

      selection = agentLib.selectSkills rec {
        inherit sources;
        catalog = agentLib.discoverCatalog sources;
        allowlist = agentLib.allowlistFor {
          inherit catalog sources;
          enable = [
            "frontend-design"
          ];
          enableAll = [
            "next"
            "ui"
          ];
        };
        skills = {};
      };
      localTargets = {
        codex = agentLib.defaultLocalTargets.codex // { enable = true; };
      };
    in
    {
      devShells = eachSystem (
        pkgs:
        let
          bundle = agentLib.mkBundle { inherit pkgs selection; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_20
              pnpm_9
              biome
              treefmt
              typescript-language-server
            ];

            shellHook = agentLib.mkShellHook {
              inherit pkgs bundle;
              targets = localTargets;
            };
          };
        }
      );

      apps = eachSystem (
        pkgs:
        let
          bundle = agentLib.mkBundle { inherit pkgs selection; };
          installLocal = agentLib.mkLocalInstallScript {
            inherit pkgs bundle;
            targets = localTargets;
          };
        in
        {
          skills-install-local = {
            type = "app";
            program = "${installLocal}/bin/skills-install-local";
            meta = {
              description = "Install agent skills to local targets";
            };
          };
        }
      );
    };
}
