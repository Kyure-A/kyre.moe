{
  description = "kyre.moe";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
  };

  outputs =
    { nixpkgs, ... }:
    let
      eachSystem =
        f:
        nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (
          system: f nixpkgs.legacyPackages.${system}
        );
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_20
            pnpm_9
            biome
            treefmt
            typescript-language-server
          ];
        };
      });
    };
}
