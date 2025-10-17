from backend.config import db
from datetime import datetime

class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"
    qid = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False, default=list)
    answer_index = db.Column(db.Integer, nullable=False)
    explanation = db.Column(db.Text)
    source_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def to_public_json(self):
        return {"qid": self.qid, "text": self.text, "options": self.options or [],
                "explanation": self.explanation or "", "source_url": self.source_url or ""}

class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # ← Replace users with your real table name
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)

class WrongQuestion(db.Model):
    __tablename__ = "wrong_questions"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("quiz_attempts.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # ← Same as above
    qid = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False, default=list)
    correct_index = db.Column(db.Integer, nullable=False)
    selected_index = db.Column(db.Integer)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def to_json(self):
        return {"id": self.id, "qid": self.qid, "text": self.question_text,
                "options": self.options or [], "correct_index": self.correct_index,
                "selected_index": self.selected_index,
                "created_at": self.created_at.isoformat() if self.created_at else None}

