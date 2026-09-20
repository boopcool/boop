/**
 * Writes Boop's demo artwork into `public/generated/`.
 *
 *   npm run generate:assets          # deterministic SVG only
 *   npm run generate:assets -- --ai  # also render neutral PNGs via OpenAI
 *
 * The deterministic SVGs are always written and are committed to the repo, so
 * the app never depends on a generation step or a network call to look alive.
 * The `--ai` pass is purely additive: it produces original, neutral BOOP demo
 * visuals. It never imitates a living artist and never references one.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { demoAssets, IMAGE_PROMPTS } from "./lib/demo-svg";

const OUT_DIR = path.join(process.cwd(), "public", "generated");
const MANIFEST = path.join(
  process.cwd(),
  "src",
  "lib",
  "demo",
  "generated-manifest.json",
);

async function writeSvgs(): Promise<number> {
  const assets = demoAssets();
  await Promise.all(
    assets.map((a) =>
      writeFile(path.join(OUT_DIR, `${a.name}.svg`), a.svg, "utf8"),
    ),
  );
  return assets.length;
}

/**
 * Renders the neutral demo visuals and records them in the manifest the seed
 * corpus reads. Anything that fails simply isn't recorded, so that asset keeps
 * its SVG — the app is never left pointing at a file that doesn't exist.
 */
async function writeAiImages(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      "· --ai requested but OPENAI_API_KEY is not set. Skipping image generation.",
    );
    return;
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, timeout: 180_000, maxRetries: 1 });
  const model =
    process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-flare";

  const assets: Record<string, string> = {};
  const entries = Object.entries(IMAGE_PROMPTS);

  // Sequential on purpose: image endpoints rate-limit hard, and this script is
  // run once in a while rather than on every build.
  for (const [name, prompt] of entries) {
    try {
      const result = await client.images.generate({
        model,
        prompt,
        size: "1024x1024",
        n: 1,
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) {
        console.warn(`· ${name}: no image data returned, keeping the SVG.`);
        continue;
      }
      await writeFile(
        path.join(OUT_DIR, `${name}.png`),
        Buffer.from(b64, "base64"),
      );
      assets[name] = `/generated/${name}.png`;
      console.log(`· ${name}.png`);
    } catch (error) {
      console.warn(
        `· ${name}: generation failed (${error instanceof Error ? error.message : "unknown error"}). Keeping the SVG.`,
      );
    }
  }

  await writeFile(
    MANIFEST,
    `${JSON.stringify(
      {
        note: "Written by `npm run generate:assets -- --ai`. Delete this file's entries to fall back to the committed SVGs.",
        generatedAt: new Date().toISOString(),
        model,
        assets,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `\n${Object.keys(assets).length} of ${entries.length} assets now resolve to PNGs via the manifest.`,
  );
  console.log(
    "\n⚠  Heads up: the seeded corpus in src/lib/demo/seed-data.ts contains\n" +
      "   hand-written human comments that quote the SVG artwork by name\n" +
      '   ("SLOW MORNING set that big", "Settlement, same day"). Overriding the\n' +
      "   artwork without also rewriting those comments will leave the results\n" +
      "   pages describing designs nobody can see.\n\n" +
      "   Use this for your own artwork, or empty `assets` in the manifest to\n" +
      "   go back to the committed SVGs.",
  );
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const count = await writeSvgs();
  console.log(`Wrote ${count} deterministic SVG assets to public/generated/`);

  if (process.argv.includes("--ai")) {
    console.log("Rendering neutral demo images via OpenAI…");
    await writeAiImages();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
