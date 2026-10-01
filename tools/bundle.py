#!/usr/bin/env python3
"""Bundle index.html + js/*.js into one self-contained page (dist/duanxue.html).

The artifact host wraps the page in its own <html>/<head>/<body>, so the output
keeps only the title, the shell styles, the body markup and one inline script.
Dev-only files (dev.js, stubs.js) are left out.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'dev.js', 'stubs.js'}

def between(s, a, b):
    i = s.index(a) + len(a)
    return s[i:s.index(b, i)]

def main():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    shell = between(html, '<!--SHELL-START-->', '<!--SHELL-END-->')
    body = between(html, '<!--BODY-START-->', '<!--BODY-END-->')
    scripts = re.findall(r'src="js/([^"?]+)', between(html, '<!--SCRIPTS-START-->', '<!--SCRIPTS-END-->'))
    parts = []
    for f in scripts:
        if f in SKIP:
            continue
        src = open(os.path.join(ROOT, 'js', f), encoding='utf-8').read()
        src = src.replace('</script', '<\\/script')
        parts.append('// ---- %s ----\n%s' % (f, src))
    js = '\n;\n'.join(parts)
    out = '<title>断雪</title>\n' + shell.strip() + '\n' + body.strip() + '\n<script>\n' + js + '\n</script>\n'
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    path = os.path.join(ROOT, 'dist', 'duanxue.html')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print('wrote', path, '%.1f KB' % (len(out.encode('utf-8')) / 1024), len(parts), 'scripts')

if __name__ == '__main__':
    main()
