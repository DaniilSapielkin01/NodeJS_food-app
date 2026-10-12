import { build } from "esbuild";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const pkgFiles = [
  "./package.json",
  ...readdirSync("../../packages").map(
    (d) => `../../packages/${d}/package.json`,
  ),
].filter(existsSync);

const external = new Set();
for (const file of pkgFiles) {
  const { dependencies = {}, peerDependencies = {} } = JSON.parse(
    readFileSync(file, "utf8"),
  );
  for (const name of [
    ...Object.keys(dependencies),
    ...Object.keys(peerDependencies),
  ]) {
    if (!name.startsWith("@packages/")) external.add(name);
  }
}

await build({
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
  external: [...external],
  banner: {
    js: `import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);`,
  },
  logLevel: "info",
});
