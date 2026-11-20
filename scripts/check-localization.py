"""Check the real generated site after npm run build; no extra dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.elements = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

    def attrs(self, tag):
        return [attrs for name, attrs in self.elements if name == tag]


english = {p.stem for p in (ROOT / 'src/content/blog').glob('*.md')}
polish = {p.stem for p in (ROOT / 'src/content/blogpl').glob('*.md')}
assert english == polish, 'Each article must have both language versions'
paths = ['/', '/about/', '/blog/', '/404/']
paths += [f'/blog/{slug}/' for slug in english]
for path in paths:
    for locale, prefix, other in [('en', '', '/pl'), ('pl', '/pl', '')]:
        route = prefix + path
        file = DIST / route.strip('/') / 'index.html'
        if path == '/404/' and not prefix:
            file = DIST / '404.html' 
        page = Page(file)
        assert page.attrs('html')[0]['lang'] == locale, route
        links = page.attrs('link')
        alternates = {a['hreflang']: urlparse(a['href']).path for a in links if a.get('rel') == 'alternate'}
        assert alternates['en'].rstrip('/') == path.rstrip('/'), route
        assert alternates['pl'].rstrip('/') == ('/pl' + path).rstrip('/'), route
        anchors = page.attrs('a')
        switch = [a for a in anchors if a.get('lang') == ('pl' if locale == 'en' else 'en')]
        assert len(switch) == 1 and switch[0]['href'].rstrip('/') == (other + path).rstrip('/'), route
        for anchor in anchors:
            href = anchor.get('href', '')
            if href.startswith('/') and not href.startswith('/assets/') and anchor not in switch:
                assert href.startswith('/pl/') if locale == 'pl' else not href.startswith('/pl/'), (route, href)
        if path == '/blog/':
            import json
            cards = [a for a in page.attrs('div') if 'data-tags' in a]
            buttons = [a['data-tag'] for a in page.attrs('button') if 'data-tag' in a and a['data-tag'] != 'all']
            tags = {tag for card in cards for tag in json.loads(card['data-tags'])}
            assert set(buttons) == tags, (route, 'Filter values must match article tags')
        scripts = page.attrs('script')
        if path.startswith('/blog/') and path != '/blog/':
            giscus = next(a for a in scripts if a.get('src') == 'https://giscus.app/client.js')
            assert giscus['data-lang'] == locale

for locale, prefix in [('en', ''), ('pl', '/pl')]:
    feed = ET.parse(DIST / prefix.strip('/') / 'rss.xml')
    assert feed.findtext('./channel/language') == locale
    items = feed.findall('./channel/item')
    assert len(items) == len(english)
    for item in items:
        assert urlparse(item.findtext('link')).path.startswith(prefix + '/blog/')
print(f'Passed: {len(paths) * 2} localized pages, {len(english)} article pairs, both RSS feeds')
