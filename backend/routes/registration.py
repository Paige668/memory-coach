# backend/routes/registration.py
from flask import request, jsonify,make_response,redirect
from flask_login import login_user, logout_user, login_required, current_user
from backend.config import db, mail
from backend.models.user_model import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
import time, secrets
from flask_login import login_user
# --- add imports ---
import re, unicodedata
from email.utils import parseaddr

ADDR_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

def extract_ascii_addr(raw: str) -> str:
    """从'显示名 <addr>'提取 addr，做规范化并强制 ASCII。"""
    s = unicodedata.normalize("NFKC", (raw or "").strip())  # 全角->半角、去奇怪空格
    name, addr = parseaddr(s)                               # 解析掉显示名
    target = (addr or s).strip().lower()                    # 兜底只用地址
    # 强制 ASCII（含中文/全角就会抛）
    target.encode("ascii")
    if not ADDR_RE.fullmatch(target):
        raise ValueError("invalid email format")
    return target





def _ok(payload, status=200):
    return jsonify(payload), status

def _err(message, status=400):
    return jsonify({"error": message}), status

# Simple in-process verification code storage (sufficient for student projects; cleared on service restart)
_PIN_CODES = {}  # { user_id: {"code": "123456", "exp": 1710000000} }
_CODE_TTL_SEC = 10 * 60  # 10 minutes valid

def _json():
    return request.get_json(silent=True) or {}

def register(app):
    # --- Development one-click login (only available when DEV_LOGIN_ENABLED=True) ---
    @app.route('/dev/login_as/<int:user_id>', methods=['GET'])
    def dev_login_as(user_id):
        if not app.config.get('DEV_LOGIN_ENABLED', False):
            return ("Not Found", 404)
        user = User.query.get_or_404(user_id)
        login_user(user, remember=True)
        return redirect('/')  # Same domain frontend: return to homepage; different domain can change to frontend address

    @app.route('/dev/logout', methods=['GET'])
    def dev_logout():
        if not app.config.get('DEV_LOGIN_ENABLED', False):
            return ("Not Found", 404)
        logout_user()
        return redirect('/')


    @app.route("/api/send_pin", methods=["POST"])
    def send_pin():
        data = _json()
        email = extract_ascii_addr(data.get("email")).strip().lower()
        caregiver = (data.get("caregiver_email") or "").strip() or None
        if caregiver:
            caregiver = extract_ascii_addr(caregiver)
        if not email:
            return _err("email required", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, caregiver_email=caregiver)
            db.session.add(user)

        code = f"{secrets.randbelow(900000) + 100000}"  # Six digits
        user.set_pin_with_expiry(code, ttl_minutes=10)
        db.session.commit()

        try:
            msg = Message("Your login PIN", recipients=[email])
            msg.body = f"Your login code is: {code}\n(Valid for 10 minutes)"
            mail.send(msg)
        except UnicodeEncodeError as e:
            bad = e.object[e.start:e.end]
            print("bad frag:", repr(bad), "codes:", [f"U+{ord(c):04X}" for c in bad])
            return _err("send mail failed: non-ASCII char in email address", 400)
        except Exception as e:
            return _err(f"send mail failed: {e}", 500)

        return _ok({"sent": True})

    @app.route("/api/verify_pin", methods=["POST"])
    def verify_pin():
        data = _json()
        email = (data.get("email") or "").strip().lower()
        pin = str(data.get("pin") or "").strip()
        remember_me = data.get("remember_me", False)
        
        if not email or not pin:
            return _err("email & pin required", 400)

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_pin_valid(pin):
            # Record failure count (optional)
            if user:
                user.pin_failed = (user.pin_failed or 0) + 1
                db.session.commit()
            return _err("invalid or expired pin", 401)

        # Verification passed → auto login + long-term persistence
        login_user(user, remember=True)

        # If user chooses remember me, save PIN code
        if remember_me:
            user.remember_pin = True
            user.set_saved_pin(pin)
        else:
            # If user doesn't choose remember me, clear previously saved PIN code
            user.remember_pin = False
            user.saved_pin_hash = None

        # Clean up temporary PIN to prevent reuse
        user.pin_hash = None
        user.pin_expires_at = None
        user.pin_failed = 0
        db.session.commit()

        return _ok({
            "ok": True, 
            "user_id": user.id,
            "has_saved_pin": user.has_saved_pin()
        })

    @app.route("/api/me", methods=["GET"])
    @login_required
    def get_current_user():
        """Get current user information"""
        return _ok({
            "ok": True,
            "data": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "phone": current_user.phone,
                "address": current_user.address,
                "emergency_contact": current_user.emergency_contact
            }
        })

    @app.route("/api/logout", methods=["POST"])
    @login_required
    def api_logout():
        logout_user()
        return _ok({"ok": True})

    # ---------------- Quick login using saved PIN code ----------------
    @app.route("/api/quick_login", methods=["POST"])
    def quick_login():
        """Quick login using saved PIN code"""
        data = _json()
        email = (data.get("email") or "").strip().lower()
        saved_pin = str(data.get("saved_pin") or "").strip()
        
        if not email or not saved_pin:
            return _err("email & saved_pin required", 400)

        user = User.query.filter_by(email=email).first()
        if not user or not user.has_saved_pin():
            return _err("no saved pin available", 401)

        if not user.check_saved_pin(saved_pin):
            # Record failure count
            user.pin_failed = (user.pin_failed or 0) + 1
            db.session.commit()
            return _err("invalid saved pin", 401)

        # Verification passed → auto login
        login_user(user, remember=True)
        
        # Clear failure count
        user.pin_failed = 0
        db.session.commit()

        return _ok({
            "ok": True, 
            "user_id": user.id,
            "message": "Quick login successful"
        })

    # ---------------- Check if user has saved PIN code ----------------
    @app.route("/api/check_saved_pin", methods=["POST"])
    def check_saved_pin():
        """Check if user has saved PIN code"""
        data = _json()
        email = (data.get("email") or "").strip().lower()
        
        if not email:
            return _err("email required", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            return _ok({"has_saved_pin": False})

        return _ok({
            "has_saved_pin": user.has_saved_pin(),
            "email": user.email
        })

    # ---------------- Set/Modify PIN ----------------
    @app.route("/api/pin_set", methods=["POST"])
    @login_required
    def api_pin_set():
        data = _json()
        new_pin = str(data.get("pin") or "").strip()
        if not new_pin.isdigit() or not (4 <= len(new_pin) <= 8):
            return _err("PIN must be 4–8 digits", 400)
        current_user.pin_hash = generate_password_hash(new_pin)
        current_user.pin_failed = 0
        db.session.commit()
        return _ok({"ok": True})

    # ---------------- Verify PIN (triggered by device change/clear data/expired/manual logout/caregiver reset) ----------------
    @app.route("/api/pin_verify", methods=["POST"])
    @login_required
    def api_pin_verify():
        data = _json()
        pin = str(data.get("pin") or "").strip()
        if not pin:
            return _err("PIN required", 400)
        ok = bool(current_user.pin_hash) and check_password_hash(current_user.pin_hash, pin)
        if ok:
            current_user.pin_failed = 0
            db.session.commit()
            return _ok({"ok": True})
        current_user.pin_failed = (current_user.pin_failed or 0) + 1
        db.session.commit()
        return _ok({"ok": False, "need_reset": current_user.pin_failed >= 3}, 401)

    # ---------------- Request PIN reset (send verification code to caregiver email) ----------------
    @app.route("/api/pin_reset_request", methods=["POST"])
    @login_required
    def api_pin_reset_request():
        email = current_user.caregiver_email
        if not email:
            return _err("no caregiver email", 400)
        code = f"{secrets.randbelow(900000) + 100000}"  # Six digits
        _PIN_CODES[current_user.id] = {"code": code, "exp": time.time() + _CODE_TTL_SEC}

        try:
            msg = Message("PIN reset code", recipients=[email])
            msg.body = f"Your verification code is: {code}\n(Valid for 10 minutes)"
            mail.send(msg)
        except Exception as e:
            return _err(f"send mail failed: {e}", 500)

        return _ok({"sent": True})

    # ---------------- Confirm PIN reset ----------------
    @app.route("/api/pin_reset_confirm", methods=["POST"])
    @login_required
    def api_pin_reset_confirm():
        data = _json()
        code = str(data.get("code") or "")
        new_pin = str(data.get("new_pin") or "").strip()
        entry = _PIN_CODES.get(current_user.id)
        if not entry or time.time() > entry["exp"]:
            return _err("code expired", 400)
        if code != entry["code"]:
            return _err("invalid code", 400)
        if not new_pin.isdigit() or not (4 <= len(new_pin) <= 8):
            return _err("PIN must be 4–8 digits", 400)

        current_user.pin_hash = generate_password_hash(new_pin)
        current_user.pin_failed = 0
        db.session.commit()
        _PIN_CODES.pop(current_user.id, None)
        return _ok({"ok": True})


    # Handle OPTIONS (preflight) requests before formal POST requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")  # Tell browser to allow all origins
            response.headers.add('Access-Control-Allow-Headers', "*")  # Allow all request headers
            response.headers.add('Access-Control-Allow-Methods', "*")  # Allow all request methods
            return response