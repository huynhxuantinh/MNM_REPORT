import csv
from apps.vocabulary.models import Word, WordSet, WordSetWord
from django.contrib.auth import get_user_model

print("Deleting old data...")
WordSetWord.objects.all().delete()
WordSet.objects.all().delete()
Word.objects.all().delete()
print("Deleted old data!")

print("Importing 1000 words...")
User = get_user_model()
admin = User.objects.filter(role='admin').first()

if not admin:
    print("Admin not found!")
    exit(1)

ws = WordSet.objects.create(
    name='1000 Tu Vung Co Ban',
    description='Bo 1000 tu vung duoc trich xuat tu tai lieu',
    created_by=admin,
    is_public=True
)

words_created = 0
with open('data/1000_words.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        text = row['text'].strip().lower()
        if not text: continue
        
        # In case the text has spaces (phrases)
        word, created = Word.objects.get_or_create(
            text=text,
            defaults={
                'phonetic': row.get('phonetic', ''),
                'part_of_speech': row.get('part_of_speech', ''),
                'definition_en': row.get('definition_en', ''),
                'definition_vi': row.get('definition_vi', ''),
                'example_en': row.get('example_en', ''),
                'example_vi': row.get('example_vi', ''),
                'level': row.get('level', '').upper() or 'A1',
                'created_by': admin
            }
        )
        
        WordSetWord.objects.create(wordset=ws, word=word, order_index=i)
        words_created += 1

print(f"Imported {words_created} words successfully!")
