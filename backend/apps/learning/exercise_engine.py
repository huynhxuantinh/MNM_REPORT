"""Exercise generator and evaluator for learning sessions/checkpoints."""
from __future__ import annotations

import random
import re
from typing import Any


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def _split_tokens(sentence: str) -> list[str]:
    return [token for token in re.findall(r"[A-Za-z']+|[.,!?;:]", sentence) if token]


def _make_multiple_choice(word, definition_pool: list[str], step_index: int) -> dict[str, Any]:
    correct = _clean_text(word.definition_vi or word.definition_en or word.text)
    distractors = [item for item in definition_pool if item and item != correct]
    random.shuffle(distractors)
    options = [correct] + distractors[:3]
    random.shuffle(options)
    return {
        "step_index": step_index,
        "exercise_type": "mc_meaning",
        "prompt": f'Chọn nghĩa đúng của "{word.text}"',
        "choices": options,
        "word_id": word.id,
        "correct_option": correct,
    }


def _build_distractor_pool(word, lesson_words, global_words=None) -> list[str]:
    local_defs = [
        _clean_text(item.definition_vi or item.definition_en or item.text)
        for item in lesson_words
        if item.id != word.id
    ]
    related_defs = []
    if global_words:
        for item in global_words:
            if item.id == word.id:
                continue
            if word.part_of_speech and item.part_of_speech and item.part_of_speech != word.part_of_speech:
                continue
            related_defs.append(_clean_text(item.definition_vi or item.definition_en or item.text))
    pool = [item for item in (local_defs + related_defs) if item]
    seen = set()
    unique_pool = []
    for item in pool:
        if item not in seen:
            seen.add(item)
            unique_pool.append(item)
    return unique_pool


def _make_fill_blank(word, step_index: int) -> dict[str, Any] | None:
    sentence = _clean_text(word.example_en)
    if not sentence:
        return None
    pattern = re.compile(rf"\b{re.escape(word.text)}\b", re.IGNORECASE)
    if not pattern.search(sentence):
        return None
    blank_sentence = pattern.sub("____", sentence, count=1)
    return {
        "step_index": step_index,
        "exercise_type": "fill_blank",
        "prompt": f"Điền từ còn thiếu: {blank_sentence}",
        "word_id": word.id,
        "correct_text": word.text,
    }


def _make_listen_choose_word(word, lesson_words, step_index: int) -> dict[str, Any] | None:
    audio_text = _clean_text(word.example_en or word.text)
    if not audio_text:
        return None
    distractors = [item.text for item in lesson_words if item.id != word.id and item.text]
    random.shuffle(distractors)
    options = [word.text] + distractors[:3]
    while len(options) < 4:
        options.append(f"option_{len(options)}")
    random.shuffle(options)
    return {
        "step_index": step_index,
        "exercise_type": "listen_choose_word",
        "prompt": "Nghe audio va chon tu dung",
        "audio_text": audio_text,
        "choices": options,
        "word_id": word.id,
        "correct_option": word.text,
    }


def _make_word_order(word, step_index: int) -> dict[str, Any] | None:
    sentence = _clean_text(word.example_en)
    if not sentence:
        return None
    tokens = _split_tokens(sentence)
    if len(tokens) < 4:
        return None
    shuffled = tokens[:]
    random.shuffle(shuffled)
    if shuffled == tokens:
        shuffled = tokens[::-1]
    return {
        "step_index": step_index,
        "exercise_type": "word_order",
        "prompt": "Sắp xếp từ thành câu đúng",
        "tokens": shuffled,
        "word_id": word.id,
        "correct_tokens": tokens,
    }


def generate_exercises_from_words(words, max_questions: int = 10, difficulty: str = "normal", global_words=None) -> list[dict[str, Any]]:
    words = list(words)
    random.shuffle(words)
    words = words[:max_questions]
    if not words:
        return []

    exercises: list[dict[str, Any]] = []
    step = 1
    for word in words:
        distractor_pool = _build_distractor_pool(word, words, global_words=global_words)
        if len(distractor_pool) < 3:
            distractor_pool += [
                _clean_text(item.definition_vi or item.definition_en or item.text)
                for item in words
                if item.id != word.id
            ]
        exercises.append(_make_multiple_choice(word, distractor_pool, step))
        step += 1

        listen = _make_listen_choose_word(word, words, step)
        if listen:
            exercises.append(listen)
            step += 1

        fill = _make_fill_blank(word, step)
        if fill:
            exercises.append(fill)
            step += 1

        if difficulty in {"hard", "adaptive"}:
            order = _make_word_order(word, step)
            if order:
                exercises.append(order)
                step += 1

        if len(exercises) >= max_questions:
            break
    return exercises[:max_questions]


def to_client_exercise(exercise: dict[str, Any]) -> dict[str, Any]:
    result = {
        "step_index": exercise["step_index"],
        "exercise_type": exercise["exercise_type"],
        "prompt": exercise["prompt"],
    }
    if "choices" in exercise:
        result["choices"] = exercise["choices"]
    if "audio_text" in exercise:
        result["audio_text"] = exercise["audio_text"]
    if "tokens" in exercise:
        result["tokens"] = exercise["tokens"]
    return result


def _answer_value(submitted_answer: Any, key: str) -> Any:
    if isinstance(submitted_answer, dict):
        return submitted_answer.get(key, "")
    if key in {"option", "text"}:
        return submitted_answer
    return ""


def evaluate_exercise_answer(exercise: dict[str, Any], submitted_answer: Any) -> bool:
    exercise_type = exercise.get("exercise_type")
    if exercise_type == "mc_meaning":
        return _clean_text(str(_answer_value(submitted_answer, "option"))).lower() == _clean_text(exercise.get("correct_option", "")).lower()
    if exercise_type == "listen_choose_word":
        return _clean_text(str(_answer_value(submitted_answer, "option"))).lower() == _clean_text(exercise.get("correct_option", "")).lower()
    if exercise_type == "fill_blank":
        return _clean_text(str(_answer_value(submitted_answer, "text"))).lower() == _clean_text(exercise.get("correct_text", "")).lower()
    if exercise_type == "word_order":
        submitted_tokens = submitted_answer.get("tokens", []) if isinstance(submitted_answer, dict) else submitted_answer
        if not isinstance(submitted_tokens, list):
            return False
        return [_clean_text(str(token)).lower() for token in submitted_tokens] == [
            _clean_text(str(token)).lower() for token in exercise.get("correct_tokens", [])
        ]
    return False
