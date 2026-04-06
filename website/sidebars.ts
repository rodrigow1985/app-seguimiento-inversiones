import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: '🏗️ Arquitectura',
      collapsed: false,
      items: [
        'architecture/domain-model',
        'architecture/api-design',
        {
          type: 'category',
          label: 'Decisiones (ADR)',
          items: [
            'architecture/adr/stack-selection',
            'architecture/adr/dual-currency',
            'architecture/adr/trading-vs-dca',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '📱 Pantallas',
      items: ['screens/screens'],
    },
    {
      type: 'category',
      label: '⚙️ Módulos',
      items: ['modules/trading', 'modules/dca', 'modules/prices'],
    },
    {
      type: 'category',
      label: '🔌 API',
      collapsed: false,
      items: [
        'api/overview',
        {
          type: 'category',
          label: 'Referencia por módulo',
          items: [
            'apis/README',
            'apis/errors',
            'apis/dashboard',
            'apis/portfolios',
            'apis/assets',
            'apis/brokers',
            'apis/trading',
            'apis/dca',
            'apis/ccl',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '📖 Guías',
      items: ['guides/setup', 'guides/data-migration'],
    },
  ],
};

export default sidebars;
