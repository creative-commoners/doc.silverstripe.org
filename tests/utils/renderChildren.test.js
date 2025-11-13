import { renderChildrenListStatic } from '../../src/utils/renderChildren.js';
import * as astroContent from 'astro:content';

describe('renderChildrenListStatic', () => {
  const mockDocs = [
    {
      id: 'v6/02_Getting_Started/01_Installation/index.md',
      slug: 'v6/02_Getting_Started/01_Installation',
      data: {
        title: 'Installation',
        summary: 'How to install',
        icon: 'download'
      }
    },
    {
      id: 'v6/02_Getting_Started/02_Configuration/index.md',
      slug: 'v6/02_Getting_Started/02_Configuration',
      data: {
        title: 'Configuration',
        summary: 'How to configure',
        icon: 'cog'
      }
    },
    {
      id: 'v6/02_Getting_Started/03_Tutorial/index.md',
      slug: 'v6/02_Getting_Started/03_Tutorial',
      data: {
        title: 'Tutorial',
        summary: 'Step by step guide',
        icon: 'book'
      }
    }
  ];

  beforeEach(() => {
    astroContent.setMockReturnValue(mockDocs);
  });

  afterEach(() => {
    astroContent.clearMock();
  });

  test('renders grid by default', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index'
    });

    expect(html).toContain('docs-overview');
    expect(html).toContain('card');
    expect(html).toContain('Installation');
    expect(html).toContain('Configuration');
    expect(html).toContain('Tutorial');
  });

  test('renders list when asList=true', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index',
      asList: true
    });

    expect(html).toContain('<ul');
    expect(html).toContain('<li>');
    expect(html).toContain('Installation');
    expect(html).toContain('</ul>');
  });

  test('includes links with correct hrefs', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index'
    });

    expect(html).toMatch(/href="\/en\/6\/getting-started\/installation\/"/);
    expect(html).toMatch(/href="\/en\/6\/getting-started\/configuration\/"/);
  });

  test('includes summaries in grid rendering', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index'
    });

    expect(html).toContain('How to install');
    expect(html).toContain('How to configure');
    expect(html).toContain('card-text');
  });

  test('includes icons in grid rendering', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index'
    });

    expect(html).toContain('fa-download');
    expect(html).toContain('fa-cog');
    expect(html).toContain('fa-book');
  });

  test('does not include summaries in list rendering', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index',
      asList: true
    });

    expect(html).not.toContain('card-text');
    expect(html).not.toContain('How to install');
  });

  test('escapes HTML in titles and summaries', async () => {
    astroContent.setMockReturnValue([{
      id: 'v6/test/xss/index.md',
      data: {
        title: '<script>alert("xss")</script>',
        summary: '<img src=x onerror=alert(1)>',
        icon: 'file'
      }
    }]);

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&quot;');
  });

  test('handles missing title gracefully', async () => {
    astroContent.setMockReturnValue([{
      id: 'v6/test/notitle/index.md',
      data: {
        icon: 'file'
      }
    }]);

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).toContain('Untitled');
  });

  test('handles missing summary gracefully', async () => {
    astroContent.setMockReturnValue([{
      id: 'v6/test/nosummary/index.md',
      data: {
        title: 'Page',
        icon: 'file'
      }
    }]);

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).not.toContain('card-text');
  });

  test('uses default icon when not specified', async () => {
    astroContent.setMockReturnValue([{
      id: 'v6/test/noicon/index.md',
      data: {
        title: 'Page'
      }
    }]);

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).toContain('fa-file-alt');
  });

  test('returns comment when currentDocId missing', async () => {
    const html = await renderChildrenListStatic({});

    expect(html).toContain('<!-- CHILDREN:');
    expect(html).toContain('Missing currentDocId');
  });

  test('returns comment when no children found', async () => {
    astroContent.setMockReturnValue([]);

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).toContain('<!-- CHILDREN: No children found -->');
  });

  test('handles errors gracefully', async () => {
    astroContent.setMockError(new Error('Collection error'));

    const html = await renderChildrenListStatic({
      currentDocId: 'v6/test/index'
    });

    expect(html).toContain('<!-- CHILDREN: Error');
    expect(html).toContain('Collection error');
  });

  test('reverses order when reverse=true', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index',
      asList: true,
      reverse: true
    });

    const tutorialIndex = html.indexOf('Tutorial');
    const installationIndex = html.indexOf('Installation');

    expect(tutorialIndex).toBeLessThan(installationIndex);
  });

  test('filters by only parameter', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index',
      only: ['Installation', 'Configuration'],
      asList: true
    });

    expect(html).toContain('Installation');
    expect(html).toContain('Configuration');
  });

  test('filters by exclude parameter', async () => {
    const html = await renderChildrenListStatic({
      currentDocId: 'v6/02_Getting_Started/index',
      exclude: ['Tutorial'],
      asList: true
    });

    expect(html).toContain('Installation');
    expect(html).not.toContain('Tutorial');
  });
});
