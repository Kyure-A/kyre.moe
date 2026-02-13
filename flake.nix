{
  description = "kyre.moe";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    next-skills = {
      url = "github:vercel-labs/next-skills";
      flake = false;
    };
  };

  outputs =
    { nixpkgs, agent-skills, next-skills, ... }:
    let
      eachSystem =
        f:
        nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (
          system: f nixpkgs.legacyPackages.${system}
        );

      agentLib = agent-skills.lib.agent-skills;

      sources = {
        next-skills = {
          path = next-skills;
          subdir = "skills";
        };
      };

      catalog = agentLib.discoverCatalog sources;
      allowlist = agentLib.allowlistFor {
        inherit catalog sources;
        enableAll = true;
      };
      selection = agentLib.selectSkills {
        inherit catalog allowlist sources;
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
              description = "Install agent skills to local targets (for example .claude/skills)";
            };
          };
        }
      );
    };
}
