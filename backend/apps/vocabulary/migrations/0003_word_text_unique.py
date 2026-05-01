from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add unique constraint to Word.text.
    NOTE: If the database already contains duplicate words, run this first to
    remove them:
        from apps.vocabulary.models import Word
        seen = set()
        for w in Word.objects.order_by('id'):
            if w.text in seen:
                w.delete()
            else:
                seen.add(w.text)
    """

    dependencies = [
        ('vocabulary', '0002_rename_words_text_idx_words_text_295e13_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='word',
            name='text',
            field=models.CharField(max_length=200, unique=True, verbose_name='Từ tiếng Anh'),
        ),
    ]
