{ pkgs, ... }:
{
  packages = with pkgs; [
    biome
    treefmt
    typescript-language-server
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    pnpm.enable = true;
    pnpm.package = pkgs.pnpm_9 or pkgs.pnpm;
  };
}
