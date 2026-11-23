import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const readFile = (file) => readFileSync(path.join(packageRoot, file), 'utf8');
const readJson = (file) => JSON.parse(readFile(file));

const pkg = readJson('package.json');

const css = {
  tokens: readFile('src/tokens.css'),
  base: readFile('src/base.css'),
  components: readFile('src/components.css'),
  index: readFile('src/index.css'),
};

const STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'final',
  'offer',
  'rejected',
  'withdrawn',
];

const COLOR_TOKENS = [
  '--jp-text',
  '--jp-text-secondary',
  '--jp-background',
  '--jp-background-element',
  '--jp-background-selected',
  '--jp-border',
  '--jp-accent',
  '--jp-on-accent',
  '--jp-accent-text',
  '--jp-accent-soft',
  '--jp-accent-soft-text',
  '--jp-accent-soft-muted',
  '--jp-accent-soft-eyebrow',
  '--jp-danger',
  '--jp-overlay',
  '--jp-chart-bar',
  '--jp-chart-bar-muted',
  '--jp-chart-grid',
];

const TYPOGRAPHY_TOKENS = ['--jp-font-serif', '--jp-font-sans'];

const LAYOUT_TOKENS = ['--jp-content-width', '--jp-wide-width'];

const COMPONENT_SELECTORS = [
  '.jp-topbar',
  '.jp-topbar__inner',
  '.jp-brand',
  '.jp-brand__dot',
  '.jp-tab',
  '.jp-page',
  '.jp-page--wide',
  '.jp-page-header',
  '.jp-eyebrow',
  '.jp-title',
  '.jp-button',
  '.jp-icon-button',
  '.jp-link-button',
  '.jp-chips',
  '.jp-chip',
  '.jp-field',
  '.jp-field__label',
  '.jp-input',
  'textarea.jp-input',
  '.jp-switch',
  '.jp-form',
  '.jp-form-group',
  '.jp-form-row',
  '.jp-form-actions',
  '.jp-field__message',
  '.jp-search',
  '.jp-segmented',
  '.jp-section',
  '.jp-section__header',
  '.jp-section__title',
  '.jp-card',
  '.jp-row',
  '.jp-row__copy',
  '.jp-row__icon',
  '.jp-callout',
  '.jp-muted',
  '.jp-error',
  '.jp-avatar',
  '.jp-status-dot',
  '.jp-status-badge',
  '.jp-toast',
];

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '');

function topLevelSelectors(source) {
  const cssText = stripComments(source);
  const selectors = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < cssText.length; index += 1) {
    const char = cssText[index];

    if (char === '{') {
      if (depth === 0) selectors.push(cssText.slice(start, index).replace(/\s+/g, ' ').trim());
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      start = index + 1;
      continue;
    }

    if (depth === 0 && char === ';') start = index + 1;
  }

  return selectors;
}

test('package identifies the published GitHub Package', () => {
  assert.equal(pkg.name, '@jobpilot-org/shared-style');
  assert.equal(pkg.version, '0.1.0');
  assert.equal(pkg.publishConfig.registry, 'https://npm.pkg.github.com');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.private, undefined);
});

test('package ships the stylesheets, the icon and the changelog', () => {
  assert.deepEqual(pkg.files, ['src', 'assets', 'CHANGELOG.md']);
  for (const file of ['src/index.css', 'src/tokens.css', 'src/base.css', 'src/components.css']) {
    assert.ok(existsSync(path.join(packageRoot, file)), `${file} is published`);
  }
  assert.ok(existsSync(path.join(packageRoot, 'assets/icon.png')), 'icon is published');
});

test('exports point to the default stylesheet, the modules and the icon', () => {
  assert.deepEqual(Object.keys(pkg.exports).sort(), [
    '.',
    './assets/icon.png',
    './base.css',
    './components.css',
    './index.css',
    './package.json',
    './tokens.css',
  ]);

  assert.equal(pkg.exports['.'], './src/index.css');
  assert.equal(pkg.exports['./index.css'], './src/index.css');
  assert.equal(pkg.exports['./tokens.css'], './src/tokens.css');
  assert.equal(pkg.exports['./base.css'], './src/base.css');
  assert.equal(pkg.exports['./components.css'], './src/components.css');
  assert.equal(pkg.exports['./assets/icon.png'], './assets/icon.png');

  for (const target of Object.values(pkg.exports)) {
    assert.ok(existsSync(path.join(packageRoot, target)), `${target} exists`);
  }
});

test('stylesheet files are marked as side-effectful', () => {
  assert.ok(Array.isArray(pkg.sideEffects), 'sideEffects names the CSS files instead of false');

  for (const file of ['src/index.css', 'src/tokens.css', 'src/base.css', 'src/components.css']) {
    const covered = pkg.sideEffects.some((pattern) =>
      ['**/*.css', '*.css', file].includes(pattern),
    );
    assert.ok(covered, `${file} keeps its side effects`);
  }
});

test('default stylesheet imports tokens, base and components in order', () => {
  const imports = [...css.index.matchAll(/@import\s+'([^']+)';/g)].map((match) => match[1]);

  assert.deepEqual(imports, ['./tokens.css', './base.css', './components.css']);
  assert.equal(topLevelSelectors(css.index).length, 0, 'index.css adds no rules of its own');
});

test('tokens define colors, typography and layout dimensions', () => {
  assert.match(css.tokens, /^:root \{/);
  assert.match(css.tokens, /color-scheme: light dark;/);

  for (const token of [...COLOR_TOKENS, ...TYPOGRAPHY_TOKENS, ...LAYOUT_TOKENS]) {
    assert.ok(css.tokens.includes(`${token}:`), `${token} is declared`);
  }
});

test('tokens define a background, text and dot color per status', () => {
  for (const status of STATUSES) {
    for (const part of ['bg', 'text', 'dot']) {
      assert.ok(
        css.tokens.includes(`--jp-status-${status}-${part}:`),
        `--jp-status-${status}-${part}`,
      );
    }
  }
});

test('tokens define the company avatar colors', () => {
  for (const token of [
    '--jp-avatar-0',
    '--jp-avatar-1',
    '--jp-avatar-2',
    '--jp-avatar-3',
    '--jp-avatar-text',
  ]) {
    assert.ok(css.tokens.includes(`${token}:`), `${token} is declared`);
  }
});

test('base keeps the global foundation and accessibility rules', () => {
  assert.match(css.base, /\*,\s*\*::before,\s*\*::after \{\s*box-sizing: border-box;/);
  assert.match(css.base, /body \{/);
  assert.match(css.base, /a \{/);
  assert.match(css.base, /:focus-visible \{/);
  assert.match(css.base, /\.jp-visually-hidden \{/);
  assert.equal(topLevelSelectors(css.base).length, 5);
});

test('components provide the shared primitives', () => {
  const selectors = new Set(topLevelSelectors(css.components));

  for (const selector of COMPONENT_SELECTORS) {
    assert.ok(selectors.has(selector), `${selector} is defined`);
  }
});

test('components provide the button variants and interactive states', () => {
  const selectors = new Set(topLevelSelectors(css.components));

  for (const selector of [
    '.jp-button--secondary',
    '.jp-button--danger',
    '.jp-button--compact',
    '.jp-chip.is-active',
    '.jp-chip.is-selected',
  ]) {
    assert.ok(selectors.has(selector), `${selector} is defined`);
  }

  for (const status of STATUSES) {
    assert.ok(selectors.has(`[data-status='${status}']`), `[data-status='${status}'] is defined`);
  }
});

test('no selector is defined twice across the modules', () => {
  const seen = new Map();

  for (const [name, source] of Object.entries(css)) {
    for (const selector of topLevelSelectors(source)) {
      if (selector.startsWith('@')) continue;
      const previous = seen.get(selector);
      assert.equal(previous, undefined, `${selector} is defined in ${previous} and ${name}`);
      seen.set(selector, name);
    }
  }
});

test('the packaged icon is a PNG file', () => {
  const icon = readFileSync(path.join(packageRoot, 'assets/icon.png'));

  assert.ok(icon.length > 1024, 'icon is not empty');
  assert.deepEqual(
    [...icon.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'icon starts with the PNG signature',
  );
});

test('no credentials are committed or published', () => {
  assert.ok(!existsSync(path.join(packageRoot, '.npmrc')), 'the package needs no .npmrc');

  const publishWorkflow = readFile('.github/workflows/publish.yml');
  assert.match(publishWorkflow, /\$\{\{ secrets\.GITHUB_TOKEN \}\}/);

  for (const file of [
    'package-lock.json',
    '.github/workflows/publish.yml',
    '.github/workflows/check.yml',
  ]) {
    const content = readFile(file);
    assert.doesNotMatch(
      content,
      /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/,
      `${file} has no token`,
    );
  }
});
