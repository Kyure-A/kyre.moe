{
  description = "kyre.moe";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    anthropic-skills = {
      url = "github:anthropics/skills";
      flake = false;
    };
    ui-skills = {
      url = "github:ibelick/ui-skills";
      flake = false;
    };
  };

  outputs =
    { nixpkgs, agent-skills, anthropic-skills, ui-skills, ... }:
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
            "ui-skills"
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
          minimumNodeVersion = pkgs.lib.trim (builtins.readFile ./.node-version);
          nodejsSlim = import ./nix/nodejs.nix { inherit pkgs; };
          nodejs = pkgs.nodejs_26.override { nodejs-slim = nodejsSlim; };
        in
        {
          default = assert pkgs.lib.assertMsg
            (pkgs.lib.versionAtLeast nodejs.version minimumNodeVersion)
            "Update nixpkgs: Node.js ${minimumNodeVersion} or newer is required.";
          pkgs.mkShell {
            packages = with pkgs; [
              actionlint
              nodejs
              (pnpm_10.override { nodejs-slim = nodejsSlim; })
              biome
              semgrep
              treefmt
              (typescript-language-server.override { inherit nodejs; })
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
