#!/usr/bin/env python3
# usage: python3 tools/setstats.py enemy key=value ...
import re, sys
p = 'js/data.js'
s = open(p).read()
name = sys.argv[1]
m = re.search(r"\n  %s: \{[^\n]*\n" % re.escape(name), s)
line = m.group(0)
new = line
for kv in sys.argv[2:]:
    k, v = kv.split('=')
    new = re.sub(r"\b%s: [\d.]+" % k, "%s: %s" % (k, v), new, count=1)
s = s.replace(line, new)
open(p, 'w').write(s)
print(new.strip()[:160])
