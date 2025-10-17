from backend.config import db
from datetime import datetime

class Memories(db.Model):
    __tablename__ = 'memories'
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),   # Link to user id
        nullable=False,
        index=True
    )
    title = db.Column(db.String(50))
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True),default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True),default=datetime.utcnow, onupdate=datetime.utcnow)
    is_favorite = db.Column(db.Boolean, default=False)
    voice_file_path = db.Column(db.String(255), nullable=True)

    def to_json(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "tags": self.tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_favorite": self.is_favorite,
            "voice_file_path": self.voice_file_path,
        }

    def __repr__(self):
        return f"<Memory id={self.id} title={self.title}>"