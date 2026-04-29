import csv

base = list(csv.DictReader(open('data/words.csv', encoding='utf-8-sig')))
with open('../data/10000_words.csv', 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['text', 'phonetic', 'part_of_speech', 'definition_en', 'definition_vi', 'example_en', 'example_vi', 'level', 'image_url'])
    c = 0
    for i in range(1, 21):
        for row in base:
            text = f"{row['text']}_{i}"
            w.writerow([
                text,
                row['phonetic'],
                row['part_of_speech'],
                row['definition_en'],
                row['definition_vi'],
                row['example_en'],
                row['example_vi'],
                row['level'],
                ''
            ])
            c += 1

print(f"Created {c} words successfully!")
