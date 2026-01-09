{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      treefmt-nix,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        treefmt = treefmt-nix.lib.${system}.evalModule {
          pkgs = pkgs;
          projectRootFile = "flake.nix";
          programs.biome.enable = true;
        };
      in
        {
          formatter = treefmt.config.build.wrapper;
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              typescript-language-server
              treefmt.config.build.wrapper
            ];
          };
        }
    );
}
