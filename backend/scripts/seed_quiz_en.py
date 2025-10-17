# scripts/seed_quiz_en.py
import json, os, sys
from backend.config import create_app
from backend.config import db
from backend.models.quiz_model import QuizQuestion

def main(path):
    app = create_app()
    with app.app_context():
        data = json.load(open(path, 'r', encoding='utf-8'))
        n = 0
        for it in data:
            if not QuizQuestion.query.filter_by(text=it['text']).first():
                db.session.add(QuizQuestion(**it)); n += 1
        db.session.commit()
        print(f"Inserted {n} new questions. Total:", QuizQuestion.query.count())

# Place at end of file, replace your current __main__ section
if __name__ == '__main__':
    import argparse
    from pathlib import Path

    # backend/scripts/seed_quiz_en.py -> locate to backend/
    BASE_DIR = Path(__file__).resolve().parents[1]
    DEFAULT_JSON = BASE_DIR / 'server_seed' / 'quiz_questions_en.json'

    ap = argparse.ArgumentParser()
    ap.add_argument('--file', '-f', default=str(DEFAULT_JSON),
                    help='path to quiz JSON (default: backend/server_seed/quiz_questions_en.json)')
    args = ap.parse_args()

    json_path = Path(args.file)
    if not json_path.exists():
        print('JSON not found:', json_path)
        raise SystemExit(1)

    main(str(json_path))

