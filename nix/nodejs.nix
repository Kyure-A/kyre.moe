{ pkgs }:

# Node 26.12.1 fixes Brotli in nixpkgs, but its shared c-ares also needs 1.34.9.
# Drop the override automatically once nixpkgs carries that security release.
if pkgs.lib.versionAtLeast pkgs.c-ares.version "1.34.9" then
  pkgs.nodejs-slim_26
else
  let
    cares = pkgs.c-ares.overrideAttrs (_: {
      version = "1.34.9";
      src = pkgs.fetchurl {
        url = "https://github.com/c-ares/c-ares/releases/download/v1.34.9/c-ares-1.34.9.tar.gz";
        hash = "sha256-k2S3ChLrWaBoMPtIjZNX+QEA3/DZiyPqNZOhg9Q+by8=";
      };
    });
  in
  pkgs.nodejs-slim_26.override {
    callPackage = path: args: pkgs.callPackage path (args // { c-ares = cares; });
  }
