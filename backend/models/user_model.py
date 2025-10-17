from flask_login import UserMixin
from backend.config import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)

    # PIN (only required for sensitive operations or device changes)
    pin_hash = db.Column(db.String(255), nullable=True)
    pin_failed = db.Column(db.Integer, default=0, nullable=False)

    pin_sent_at = db.Column(db.DateTime, nullable=True)
    pin_expires_at = db.Column(db.DateTime, nullable=True)
    # Caregiver email (for verification code PIN reset)
    caregiver_email = db.Column(db.String(255), nullable=True)
    
    # Remember me functionality
    remember_pin = db.Column(db.Boolean, default=False, nullable=True)
    saved_pin_hash = db.Column(db.String(255), nullable=True)  # Saved PIN code (for remember me)
    
    # User profile information
    name = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.Text, nullable=True)
    emergency_contact = db.Column(db.String(255), nullable=True)


    def set_pin(self, raw):
        self.pin_hash = generate_password_hash(str(raw))

    def check_pin(self, raw):
        return self.pin_hash and check_password_hash(self.pin_hash, str(raw))

    def set_pin_with_expiry(self, raw: str, ttl_minutes: int = 10):
        self.set_pin(raw)
        now = datetime.utcnow()
        self.pin_sent_at = now
        self.pin_expires_at = now + timedelta(minutes=ttl_minutes)

    def check_pin_valid(self, raw: str) -> bool:
        if not self.check_pin(raw):
            return False
        if self.pin_expires_at and datetime.utcnow() > self.pin_expires_at:
            return False
        return True

    def set_saved_pin(self, raw: str):
        """Save PIN code for remember me functionality"""
        self.saved_pin_hash = generate_password_hash(str(raw))

    def check_saved_pin(self, raw: str) -> bool:
        """Check saved PIN code"""
        return self.saved_pin_hash and check_password_hash(self.saved_pin_hash, str(raw))

    def has_saved_pin(self) -> bool:
        """Check if saved PIN code exists"""
        return bool(self.saved_pin_hash and self.remember_pin)
