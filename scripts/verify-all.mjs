// Script test: simulasikan toggle dark mode dan cek logo swap
import fs from "fs";
import { execSync } from "child_process";

// Test 1: Logo SVG gelap valid
const svg = fs.readFileSync('public/images/logo-gentanusa-dark.svg', 'utf8');
const checks = {
  'xmlns': svg.includes('xmlns="http://www.w3.org/2000/svg"'),
  'viewBox': svg.includes('viewBox='),
  'has paths': (svg.match(/<path/g) || []).length >= 3,
  'has circles': (svg.match(/<circle/g) || []).length >= 3,
  'no white bg': !svg.includes('fill="#fff"') && !svg.includes('fill="#ffffff"'),
  'gold color': svg.includes('#f0a500') || svg.includes('#e8c840'),
  'close tags': svg.startsWith('<svg') && svg.trim().endsWith('</svg>'),
};
console.log('=== SVG Gelap Validation ===');
Object.entries(checks).forEach(([k, v]) => console.log(`${k}: ${v ? 'PASS' : 'FAIL'}`));

// Test 2: CSS gelap vars ada
const css = fs.readFileSync('app/globals.css', 'utf8');
const cssChecks = {
  'dark bg var': css.includes('--bg: #0e0e16') || css.includes('[data-theme="dark"]'),
  'logoImg dark filter': css.includes('[data-theme="dark"] .logoImg'),
  'footer dark': css.includes('[data-theme="dark"] .footer'),
  'bg-canvas dark': css.includes('[data-theme="dark"] .bg-canvas'),
};
console.log('\n=== CSS Dark Mode ===');
Object.entries(cssChecks).forEach(([k, v]) => console.log(`${k}: ${v ? 'PASS' : 'FAIL'}`));

// Test 3: site.tsx per-mode logic
const site = fs.readFileSync('components/site.tsx', 'utf8');
const siteChecks = {
  'dark state': site.includes('const [dark, setDark]'),
  'PNG source': site.includes('/images/logo-gentanusa.png'),
  'SVG dark source': site.includes('/images/logo-gentanusa-dark.svg'),
  'conditional src': site.includes('dark ?') && site.includes('logo-gentanusa-dark.svg'),
  'useRef mounted': site.includes('const mounted'),
};
console.log('\n=== Site.tsx Per-Mode ===');
Object.entries(siteChecks).forEach(([k, v]) => console.log(`${k}: ${v ? 'PASS' : 'FAIL'}`));

// Test 4: background-canvas dark mode
const bg = fs.readFileSync('components/background-canvas.tsx', 'utf8');
const bgChecks = {
  'dark gradient': bg.includes('#0e0e16') || bg.includes('#0a0a14'),
  'network lines': bg.includes('stroke="rgba(255,255,255"') || bg.includes('#ffffff'),
  'glows': bg.includes('radial-gradient'),
  'kawung': bg.includes('kawung') || bg.includes('circle'),
  'parang': bg.includes('parang') || bg.includes('path d="M0 280'),
};
console.log('\n=== Background Canvas ===');
Object.entries(bgChecks).forEach(([k, v]) => console.log(`${k}: ${v ? 'PASS' : 'FAIL'}`));

console.log('\n=== ALL DONE ===');