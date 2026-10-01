"""Plot the measured medians and observed ranges, never substitute missing data."""

import argparse
import json
from pathlib import Path
from statistics import median

import matplotlib.pyplot as plt
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--results", type=Path, default=Path(__file__).parent / "results")
args = parser.parse_args()
builds = json.loads((args.results / "builds.json").read_text())
browser = json.loads((args.results / "browser.json").read_text())
assert builds["complete"] and browser["complete"], "Measurements must be complete"
assert all(sample["success"] for sample in builds["samples"] + browser["samples"]
           + browser["navigationSamples"])

variants = [variant["id"] for variant in builds["variants"]]
labels = {variant["id"]: variant["label"] for variant in builds["variants"]}
colors = {"next": "#526273", "tanstack": "#008EAA", "rshono": "#DF9516"}
routes = [route["path"] for route in browser["config"]["routes"]]
route_labels = ["Home", "Blog index", "JA article", "EN article"]

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 10,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "axes.labelsize": 10,
    "figure.facecolor": "#FAFAF8",
    "axes.facecolor": "#FAFAF8",
    "text.color": "#283847",
    "axes.labelcolor": "#283847",
    "xtick.color": "#283847",
    "ytick.color": "#283847",
})
fig, axes = plt.subplots(3, 1, figsize=(11.5, 12))


def draw_bar(ax, position, values, width, color, label=None, alpha=1, hatch=None, digits=1):
    assert values and all(value is not None for value in values)
    value = median(values)
    ax.bar(position, value, width, color=color, alpha=alpha, hatch=hatch,
           label=label, zorder=3)
    ax.errorbar(position, value, yerr=[[value - min(values)], [max(values) - value]],
                color="#283847", capsize=3, linewidth=1, zorder=4)
    ax.annotate(f"{value:.{digits}f}", (position, max(values)), xytext=(0, 5),
                textcoords="offset points", ha="center", va="bottom", fontsize=9)


for index, variant in enumerate(variants):
    for offset, mode, alpha, hatch in [(-0.18, "cold", 1, None), (0.18, "warm", 0.45, "//")]:
        values = [sample["elapsedMs"] / 1000 for sample in builds["samples"]
                  if sample["variant"] == variant and sample["mode"] == mode]
        draw_bar(axes[0], index + offset, values, 0.32, colors[variant],
                 mode.title() if index == 0 else None, alpha, hatch)
axes[0].set_xticks(range(len(variants)), [labels[variant] for variant in variants])
axes[0].set_ylabel("Seconds")
axes[0].set_title("Native production build — shared content preparation excluded", loc="left")
axes[0].legend(title="Cache", frameon=False, loc="upper right")

positions = np.arange(len(routes))
for index, variant in enumerate(variants):
    for route_index, route in enumerate(routes):
        samples = [sample for sample in browser["samples"]
                   if sample["variant"] == variant and sample["route"] == route]
        position = positions[route_index] + (index - 1) * 0.24
        draw_bar(axes[1], position, [sample["metrics"]["lcpMs"] / 1000 for sample in samples],
                 0.21, colors[variant], labels[variant] if route_index == 0 else None, digits=2)
        draw_bar(axes[2], position,
                 [(sample["metrics"]["documentEncodedBytes"] + sample["metrics"]["jsEncodedBytes"]
                   + sample["metrics"]["cssEncodedBytes"]) / 1024 for sample in samples],
                 0.21, colors[variant])
for ax in axes[1:]:
    ax.set_xticks(positions, route_labels)
axes[1].set_ylabel("Seconds")
window_seconds = browser["config"]["observationWindowMs"] / 1000
axes[1].set_title(f"Largest Contentful Paint — last candidate in a {window_seconds:g}-second window", loc="left")
axes[1].legend(frameon=False, ncol=3, loc="upper right")
axes[2].set_ylabel("KiB (gzip bodies)")
axes[2].set_title("HTML + JavaScript + CSS transferred inside the observation window", loc="left")

for ax in axes:
    ax.set_ylim(0, ax.get_ylim()[1] * 1.18)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color("#CFD7DB")
    ax.grid(axis="y", color="#DCE2E5", linewidth=0.6, zorder=0)
    ax.tick_params(axis="both", length=0)
    ax.set_axisbelow(True)

profile = browser["config"]["profile"]
fig.suptitle("kyre.moe — the same 22 posts and 66 static pages", x=0.08, ha="left",
             fontsize=19, fontweight="bold")
fig.text(0.08, 0.935,
         f"Median with observed min–max range · builds n={builds['config']['buildRepetitions']}, "
         f"pages n={browser['config']['browserRepetitions']} · lower is better", fontsize=10)
fig.text(0.08, 0.035,
         f"Chrome {browser['environment']['chromeVersion']} · CPU {profile['cpuSlowdown']}× · "
         f"{profile['latencyMs']} ms latency · {profile['downloadBytesPerSecond'] * 8 / 1e6:.1f} Mbps · "
         "fresh browser context, identical gzip static server\n"
         "Next build includes TypeScript checking. Home uses animated WebGL. External embeds are blocked.\n"
         "HTML includes inline RSC/JSON. Additional RSC fetches, fonts and images are in report.md's total-payload table.", fontsize=8.5)
fig.subplots_adjust(left=0.08, right=0.97, top=0.90, bottom=0.10, hspace=0.40)
fig.savefig(args.results / "comparison.png", dpi=180)
fig.savefig(args.results / "comparison.svg")
print(args.results / "comparison.png")
