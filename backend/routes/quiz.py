from flask import request, jsonify
from flask_login import login_required, current_user
from backend.config import db
from backend.models.quiz_model import QuizQuestion, QuizAttempt, WrongQuestion
from sqlalchemy.sql import func

def _ok(p, status=200): return jsonify(p), status
def _err(msg, status=400): return jsonify({"error": msg}), status

def register(app):

    # Compatible with old paths from your screenshots, also provide more semantic new paths
    @app.route("/api/create_quiz", methods=["GET"])
    @login_required
    def quiz_start():
        """Start a quiz: exclusive for logged-in users"""
        count = int(request.args.get("count") or 5)

        attempt = QuizAttempt(user_id=current_user.id, score=0, total=count)
        db.session.add(attempt)
        db.session.commit()

        qs = QuizQuestion.query.order_by(func.random()).limit(count).all()
        return _ok({
            "attempt_id": attempt.id,
            "questions": [q.to_public_json() for q in qs],
        })

    @app.route("/api/check_quiz", methods=["POST"])
    @login_required
    def quiz_check():
        data = request.get_json() or {}
        qid = int(data.get("question_id"))
        selected = int(data.get("selected_index"))
        q = QuizQuestion.query.get(qid)
        if not q:
            return _err("question not found", 404)
        return _ok({
            "correct": (selected == q.answer_index),
            "correct_index": q.answer_index,
            "explanation": q.explanation or "",
        })

    @app.route("/api/submit_quiz", methods=["POST"])
    @login_required
    def quiz_submit():
        data = request.get_json() or {}
        attempt_id = int(data.get("attempt_id") or 0)
        answers = data.get("answers") or []

        attempt = QuizAttempt.query.get(attempt_id)
        if not attempt:
            return _err("attempt not found", 404)
        if attempt.user_id != current_user.id:
            return _err("forbidden", 403)

        score = 0
        for item in answers:
            q = QuizQuestion.query.get(int(item["question_id"]))
            if not q:
                continue
            sel = int(item.get("selected_index", -1))
            if sel == q.answer_index:
                score += 1
            else:
                db.session.add(WrongQuestion(
                    attempt_id=attempt.id,
                    user_id=current_user.id,          # Record ownership
                    qid=q.qid,
                    question_text=q.text,
                    options=q.options,
                    correct_index=q.answer_index,
                    selected_index=sel,
                ))
        attempt.score = score
        attempt.total = attempt.total or len(answers)
        db.session.commit()
        return _ok({"score": score, "total": attempt.total})

    @app.route("/api/wrong_quiz", methods=["GET"])
    @login_required
    def quiz_wrongs():
        """Wrong question cards for current logged-in user; optionally filter by attempt_id for most recent"""
        attempt_id = request.args.get("attempt_id", type=int)
        q = WrongQuestion.query.filter_by(user_id=current_user.id)
        if attempt_id:
            q = q.filter_by(attempt_id=attempt_id)
        items = q.order_by(WrongQuestion.created_at.desc()).all()
        return _ok([it.to_json() for it in items])

