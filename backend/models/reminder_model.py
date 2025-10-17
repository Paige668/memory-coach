from backend.config import db
from datetime import datetime

class Reminder(db.Model):
    __tablename__ = 'reminders'
    rid = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),   # Link to user id
        nullable=False,
        index=True
    )

    title = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=True)

    scheduled_at = db.Column(db.DateTime(timezone=True), nullable=False)
    repeat_rule = db.Column(db.String(20), default='NONE') # NONE/DAILY
    repeat_interval = db.Column(db.Integer, default=1)

    is_active = db.Column(db.Boolean, default=True)
    last_sent_at = db.Column(db.DateTime(timezone=True), nullable=True)
    next_run_at = db.Column(db.DateTime(timezone=True), nullable=True)

    channels = db.Column(db.JSON, nullable=False, default=list)
    recipient_email = db.Column(db.String(120), nullable=True)
    reminder_type = db.Column(db.String(20), default='general')

    media_paths = db.Column(db.JSON, nullable=False, default=list)

    # Audit
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_json(self):
        return {
            "rid": self.rid,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description or "",
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "repeat_rule": self.repeat_rule,
            "repeat_interval": self.repeat_interval,
            "is_active": self.is_active,
            "channels": self.channels or [],
            "recipient_email": self.recipient_email,
            "reminder_type": self.reminder_type,
            "last_sent_at": self.last_sent_at.isoformat() if self.last_sent_at else None,
            "next_run_at": self.next_run_at.isoformat() if self.next_run_at else None,
            "media_paths": self.media_paths or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Reminder rid={self.rid} title={self.title}>"