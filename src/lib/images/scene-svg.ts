const PALETTES = [
  { sky: "#b8d4e8", ground: "#c8ddb0", accent: "#e8c4a0" },
  { sky: "#d4c4e8", ground: "#b0cdb8", accent: "#e8b8c4" },
  { sky: "#e8d8b8", ground: "#b8d0c8", accent: "#c4b8e8" },
  { sky: "#c8e0e8", ground: "#d8c8a8", accent: "#a8c8b0" },
];

function has(prompt: string, ...words: string[]): boolean {
  const lower = prompt.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function drawDinosaur(x: number, y: number, scale: number, color: string): string {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="30" rx="55" ry="40" fill="${color}"/>
      <ellipse cx="-45" cy="15" rx="28" ry="22" fill="${color}"/>
      <circle cx="-58" cy="5" r="6" fill="#1a1f2e"/>
      <path d="M-70 10 L-85 0 L-70 18 Z" fill="${color}"/>
      <path d="M40 25 L75 10 L70 40 L45 35 Z" fill="${color}" opacity="0.9"/>
      <ellipse cx="15" cy="55" rx="12" ry="18" fill="${color}"/>
      <ellipse cx="-10" cy="58" rx="12" ry="18" fill="${color}"/>
      <path d="M50 15 Q65 0 80 5 Q65 15 50 25 Z" fill="${color}" opacity="0.85"/>
      <path d="M55 5 Q70 -5 85 0 Q70 10 55 15 Z" fill="${color}" opacity="0.8"/>
    </g>`;
}

function drawChild(x: number, y: number, scale: number): string {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="75" rx="35" ry="45" fill="#6b9fd4"/>
      <circle cx="0" cy="-5" r="32" fill="#f5d0b5"/>
      <circle cx="-10" cy="-8" r="4" fill="#1a1f2e"/>
      <circle cx="10" cy="-8" r="4" fill="#1a1f2e"/>
      <path d="M-8 5 Q0 12 8 5" stroke="#c4785a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="-28" cy="50" rx="10" ry="28" fill="#f5d0b5" transform="rotate(20 -28 50)"/>
      <ellipse cx="28" cy="50" rx="10" ry="28" fill="#f5d0b5" transform="rotate(-20 28 50)"/>
      <ellipse cx="-14" cy="115" rx="12" ry="8" fill="#4a5568"/>
      <ellipse cx="14" cy="115" rx="12" ry="8" fill="#4a5568"/>
      <path d="M-18 -30 Q0 -45 18 -30" fill="#2c1810"/>
    </g>`;
}

function drawTree(x: number, y: number, h: number): string {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-8" y="${h * 0.4}" width="16" height="${h * 0.6}" rx="4" fill="#8b6914"/>
      <circle cx="0" cy="${h * 0.25}" r="${h * 0.35}" fill="#5a8f4a" opacity="0.9"/>
      <circle cx="-20" cy="${h * 0.35}" r="${h * 0.25}" fill="#6ba05a" opacity="0.85"/>
      <circle cx="20" cy="${h * 0.35}" r="${h * 0.25}" fill="#6ba05a" opacity="0.85"/>
    </g>`;
}

function drawHouse(x: number, y: number): string {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-60" y="-40" width="120" height="90" rx="4" fill="#e8d4b8"/>
      <polygon points="-70,-40 0,-100 70,-40" fill="#b85c4a"/>
      <rect x="-20" y="10" width="40" height="40" rx="2" fill="#8b6914"/>
      <circle cx="45" cy="-10" r="12" fill="#f9e4a0" opacity="0.8"/>
    </g>`;
}

function drawSun(): string {
  return `
    <circle cx="860" cy="120" r="55" fill="#f9d56e" opacity="0.85"/>
    <circle cx="860" cy="120" r="70" fill="#f9d56e" opacity="0.2"/>`;
}

function drawCloud(x: number, y: number): string {
  return `
    <g opacity="0.7">
      <ellipse cx="${x}" cy="${y}" rx="40" ry="22" fill="#fff"/>
      <ellipse cx="${x + 35}" cy="${y + 5}" rx="30" ry="18" fill="#fff"/>
      <ellipse cx="${x - 30}" cy="${y + 8}" rx="25" ry="15" fill="#fff"/>
    </g>`;
}

function drawFlower(x: number, y: number): string {
  return `
    <g transform="translate(${x},${y})">
      <line x1="0" y1="0" x2="0" y2="40" stroke="#5a8f4a" stroke-width="3"/>
      <circle cx="0" cy="0" r="12" fill="#f0a0b0"/>
      <circle cx="-10" cy="-5" r="8" fill="#f5b8c8"/>
      <circle cx="10" cy="-5" r="8" fill="#f5b8c8"/>
      <circle cx="0" cy="-12" r="8" fill="#f5b8c8"/>
      <circle cx="0" cy="0" r="5" fill="#f9d56e"/>
    </g>`;
}

/** 무료 API 없을 때 키워드 기반 장면 SVG (플레이스홀더보다 풍부한 그림) */
export function buildSceneSvg(imagePrompt: string, _childName: string): Buffer {
  const palette = PALETTES[imagePrompt.length % PALETTES.length];

  let scene = "";

  if (has(imagePrompt, "dinosaur", "dino", "티라노", "공룡")) {
    scene += drawDinosaur(680, 520, 1.2, "#6ba05a");
    scene += drawDinosaur(780, 560, 0.8, "#8fbc6a");
  }

  if (has(imagePrompt, "forest", "tree", "숲", "나무")) {
    scene += drawTree(120, 620, 140);
    scene += drawTree(220, 640, 110);
    scene += drawTree(850, 630, 130);
  } else if (has(imagePrompt, "room", "living", "house", "home", "집", "방")) {
    scene += drawHouse(512, 480);
  } else if (has(imagePrompt, "garden", "flower", "꽃", "정원")) {
    scene += drawFlower(200, 580);
    scene += drawFlower(280, 600);
    scene += drawFlower(750, 590);
  }

  if (has(imagePrompt, "night", "moon", "별", "밤")) {
    scene += `<circle cx="800" cy="100" r="40" fill="#f0e8d0" opacity="0.9"/>`;
  } else {
    scene += drawSun();
  }

  scene += drawCloud(150, 150);
  scene += drawCloud(400, 100);
  scene += drawChild(420, 480, 1.1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.sky}"/>
        <stop offset="100%" stop-color="${palette.ground}" stop-opacity="0.4"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.ground}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${palette.ground}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#sky)"/>
    <ellipse cx="512" cy="900" rx="600" ry="120" fill="url(#ground)"/>
    ${scene}
  </svg>`;

  return Buffer.from(svg, "utf8");
}
