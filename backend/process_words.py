import re
import csv
import os

with open('raw_words.txt', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()

output = []
for line in lines:
    line = line.strip()
    if not line: continue
    
    # Try the most comprehensive match first
    # Example: 70. blue, /bluː/, (adj., n.) xanh, màu xanh
    match = re.match(r'^(\d+)\.\s+([A-Za-z]+)[,\s]*(?:/([^/]+)/)?[,\s]*(?:\(([^)]+)\))?[,\s]*[:\-]?\s*(.*)$', line)
    
    if match:
        num, word, phonetic, pos, meaning = match.groups()
        output.append({
            'text': word.strip().lower(),
            'phonetic': f'/{phonetic.strip()}/' if phonetic else '',
            'part_of_speech': pos.strip() if pos else '',
            'definition_en': '',
            'definition_vi': meaning.strip() if meaning else '',
            'example_en': '',
            'example_vi': '',
            'level': 'A1',
            'image_url': ''
        })
    else:
        # Fallback
        match2 = re.match(r'^(\d+)\.\s+([^,\s]+)[,\s]*(.*)$', line)
        if match2:
            num, word, meaning = match2.groups()
            output.append({
                'text': word.strip().lower(),
                'phonetic': '',
                'part_of_speech': '',
                'definition_en': '',
                'definition_vi': meaning.strip(),
                'example_en': '',
                'example_vi': '',
                'level': 'A1',
                'image_url': ''
            })
        else:
            print("Could not parse:", line)

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

with open('data/1000_words.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['text', 'phonetic', 'part_of_speech', 'definition_en', 'definition_vi', 'example_en', 'example_vi', 'level', 'image_url'])
    writer.writeheader()
    writer.writerows(output)

print(f"Processed {len(output)} words to data/1000_words.csv")
