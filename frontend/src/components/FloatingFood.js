import React from "react";
import { motion } from "framer-motion";

/* ── 12 items split into 3 depth layers ──────────────────────────── */
export const FOOD_ITEMS = [
  // Near layer — large, fast, no blur, strong parallax
  { emoji: "🍕", size: 54, x: "8%",  y: "15%", duration: 5.5, floatDelay: 0,   enterDelay: 0,    layer: "near" },
  { emoji: "🍔", size: 50, x: "85%", y: "10%", duration: 6,   floatDelay: 1,   enterDelay: 0.15, layer: "near" },
  { emoji: "🍜", size: 52, x: "72%", y: "72%", duration: 5,   floatDelay: 0.5, enterDelay: 0.3,  layer: "near" },
  { emoji: "🌮", size: 48, x: "14%", y: "78%", duration: 5.8, floatDelay: 2,   enterDelay: 0.1,  layer: "near" },
  // Mid layer — medium size, gentle sway, slight blur
  { emoji: "🍣", size: 44, x: "92%", y: "45%", duration: 7,   floatDelay: 1.5, enterDelay: 0.25, layer: "mid" },
  { emoji: "🥗", size: 40, x: "5%",  y: "50%", duration: 6.5, floatDelay: 0.8, enterDelay: 0.4,  layer: "mid" },
  { emoji: "🍩", size: 46, x: "60%", y: "85%", duration: 8,   floatDelay: 3,   enterDelay: 0.2,  layer: "mid" },
  { emoji: "🧆", size: 42, x: "40%", y: "8%",  duration: 7.5, floatDelay: 2.5, enterDelay: 0.35, layer: "mid" },
  // Far layer — small, slow, soft blur, minimal parallax
  { emoji: "🥪", size: 36, x: "25%", y: "88%", duration: 8.5, floatDelay: 1.2, enterDelay: 0.05, layer: "far" },
  { emoji: "🍱", size: 38, x: "78%", y: "28%", duration: 9,   floatDelay: 0.3, enterDelay: 0.45, layer: "far" },
  { emoji: "🧁", size: 32, x: "18%", y: "35%", duration: 10,  floatDelay: 3.5, enterDelay: 0.3,  layer: "far" },
  { emoji: "🍗", size: 34, x: "55%", y: "18%", duration: 8.2, floatDelay: 1.8, enterDelay: 0.15, layer: "far" },
];

const LAYER_CONFIG = {
  near: {
    opacityFrames: [0, 0.35, 0.2,  0.3,  0.2 ],
    yFrames:       [20, 0,  -18,   4,   -18  ],
    xFrames:       [0,  8,   -4,  10,    -4  ],
    rotateFrames:  [0,  3,   -5,   6,    -5  ],
    scaleFrames:   [0.95, 1, 1.02, 0.98, 1.02],
    filter:        "none",
    parallax:      { x: 12, y: 8 },
  },
  mid: {
    opacityFrames: [0, 0.22, 0.12, 0.18, 0.12],
    yFrames:       [20, 0,  -24,   0,   -24  ],
    xFrames:       [0, -6,    4,  -6,     4  ],
    rotateFrames:  [0, -3,    4,  -3,     4  ],
    scaleFrames:   null,
    filter:        "blur(0.3px)",
    parallax:      { x: 5, y: 3 },
  },
  far: {
    opacityFrames: [0, 0.12, 0.06, 0.10, 0.06],
    yFrames:       [20, 0,  -24,   0,   -24  ],
    xFrames:       [0,  0,    0,   0,     0  ],
    rotateFrames:  [0,  0,   -4,   4,    -4  ],
    scaleFrames:   null,
    filter:        "blur(0.8px)",
    parallax:      { x: 2, y: 1 },
  },
};

/**
 * A single floating food emoji.
 *
 * Props:
 *  emoji, size, x, y   — position & appearance
 *  duration, floatDelay, enterDelay — timing
 *  layer               — "near" | "mid" | "far"  (controls opacity, blur, parallax strength)
 *  mouseX, mouseY      — -1..1 values from the parent's mousemove handler (default 0 = no parallax)
 */
export const FloatingFood = ({
  emoji, size, x, y, duration, floatDelay, enterDelay,
  layer = "mid", mouseX = 0, mouseY = 0,
}) => {
  const cfg = LAYER_CONFIG[layer];

  const animateObj = {
    opacity: cfg.opacityFrames,
    y:       cfg.yFrames,
    x:       cfg.xFrames,
    rotate:  cfg.rotateFrames,
  };
  if (cfg.scaleFrames) animateObj.scale = cfg.scaleFrames;

  return (
    <div
      style={{
        position:      "absolute",
        left:          x,
        top:           y,
        transform:     `translate(${mouseX * cfg.parallax.x}px, ${mouseY * cfg.parallax.y}px)`,
        transition:    "transform 0.3s ease-out",
        pointerEvents: "none",
        userSelect:    "none",
      }}
    >
      <motion.div
        style={{ fontSize: size, lineHeight: 1, filter: cfg.filter }}
        initial={{ opacity: 0, y: 20 }}
        animate={animateObj}
        transition={{
          duration,
          delay:       enterDelay,
          times:       [0, 0.12, 0.5, 0.75, 1],
          repeat:      Infinity,
          ease:        "easeInOut",
          repeatDelay: floatDelay * 0.1,
        }}
      >
        {emoji}
      </motion.div>
    </div>
  );
};
