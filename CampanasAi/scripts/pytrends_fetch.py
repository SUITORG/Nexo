import sys, json, time
import pandas as pd
from pytrends.request import TrendReq

niche = sys.argv[1] if len(sys.argv) > 1 else ''
region = sys.argv[2] if len(sys.argv) > 2 else ''

results = {'google_trends': [], 'reddit_trends': []}

if niche:
    try:
        pytrends = TrendReq(hl='es-MX', tz=300)
        geo = ''
        rl = region.lower()
        if any(x in rl for x in ['nuevo león', 'nuevo leon', 'monterrey', 'méxico', 'mexico']):
            geo = 'MX'
        elif any(x in rl for x in ['us', 'usa', 'united']):
            geo = 'US'
        elif 'colombia' in rl:
            geo = 'CO'
        elif any(x in rl for x in ['españa', 'spain']):
            geo = 'ES'
        elif 'argentina' in rl:
            geo = 'AR'
        elif 'chile' in rl:
            geo = 'CL'

        kw = niche.split(',')[0].strip()[:50]
        pytrends.build_payload([kw], timeframe='now 7-d', geo=geo)
        time.sleep(3)

        interest = pytrends.interest_over_time()
        if interest is not None and not interest.empty:
            for date, row in interest.iterrows():
                val = int(row[kw]) if not pd.isna(row[kw]) else 0
                results['google_trends'].append({
                    'type': 'interest',
                    'date': str(date.date()),
                    'value': val,
                    'query': kw
                })

        related = pytrends.related_queries()
        time.sleep(2)
        if kw in related and related[kw] is not None and related[kw].get('rising') is not None:
            rising = related[kw]['rising'].head(10)
            for _, r in rising.iterrows():
                val = int(r['value']) if not pd.isna(r['value']) else 0
                results['google_trends'].append({
                    'type': 'rising',
                    'query': r['query'],
                    'value': val
                })

        try:
            trending = pytrends.trending_searches(pn='mexico')
            if trending is not None and not trending.empty:
                for _, r in trending.head(10).iterrows():
                    results['google_trends'].append({
                        'type': 'trending',
                        'query': str(r[0]),
                        'value': 0
                    })
        except:
            pass
    except Exception as e:
        results['google_trends'].append({'type': 'error', 'error': str(e)[:200]})

import requests as req
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
try:
    keywords = niche.replace(',', ' ').split()[:3]
    for kw in keywords:
        q = f"{kw}+solar" if 'solar' not in kw.lower() and 'panel' not in kw.lower() else kw
        url = f"https://www.reddit.com/search.json?q={q}&limit=5&sort=hot&t=week"
        resp = req.get(url, headers=headers, timeout=10)
        data = resp.json()
        for child in data.get('data', {}).get('children', []):
            post = child.get('data', {})
            results['reddit_trends'].append({
                'title': post.get('title', ''),
                'score': post.get('score', 0),
                'subreddit': post.get('subreddit', ''),
                'comments': post.get('num_comments', 0),
                'url': f"https://www.reddit.com{post.get('permalink', '')}"
            })
        time.sleep(2)
except Exception as e:
    results['reddit_trends'].append({'type': 'error', 'error': str(e)[:200]})

print(json.dumps(results, ensure_ascii=False, default=str))
