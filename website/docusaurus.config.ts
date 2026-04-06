import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'App Seguimiento Inversiones',
  tagline: 'Documentación técnica del proyecto',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'http://localhost',
  baseUrl: '/',

  organizationName: 'rodri',
  projectName: 'app-seguimiento-inversiones',

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '📊 Inversiones Docs',
      items: [
        { to: '/intro', label: 'Introducción', position: 'left' },
        { to: '/architecture/domain-model', label: 'Arquitectura', position: 'left' },
        { to: '/api/overview', label: 'API', position: 'left' },
        { to: '/screens/screens', label: 'Pantallas', position: 'left' },
        { to: '/modules/trading', label: 'Módulos', position: 'left' },
        { to: '/guides/setup', label: 'Guías', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `App Seguimiento Inversiones — Stack: React + Express + PostgreSQL`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'sql', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
