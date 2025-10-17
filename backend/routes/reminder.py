from backend.config import db
from flask import request,jsonify,make_response
from flask_login import login_required, current_user
from backend.models.reminder_model import Reminder
from datetime import datetime,timedelta
import os,uuid,traceback
from werkzeug.utils import secure_filename
from flask_mail import Message
from email.header import Header
from backend.config import mail



def _ok(payload,status=200):    # Unified response payload for frontend
    return jsonify(payload),status

def _err(message,status=400):
    return jsonify({'error':message}),status

def register(app):
    # Add/delete reminder tasks
    @app.route('/api/get_reminder',methods=['GET'])
    @login_required
    def get_reminders():
        reminders = Reminder.query.filter_by(user_id=current_user.id).order_by(Reminder.scheduled_at.asc()).all()
        json_reminders = list(map(lambda x:x.to_json(),reminders))
        return _ok({
            "ok": True,
            "data": json_reminders
        })

    @app.route('/api/create_reminder',methods=['POST','OPTIONS'])
    @login_required
    def create_reminder():
        if request.method == "OPTIONS":
            # Preflight request
            return _ok({"ok":True})

        data = request.get_json() or {}
        title = (data.get('title') or "").strip()     # Task description
        description = (data.get("description") or "").strip()
        channels = data.get('channels') or []          # Reminder channels
        recipient_email = (data.get('recipient_email') or "").strip()
        reminder_type = (data.get('reminder_type') or "general").strip()

        scheduled_at = data.get('scheduled_at')
        repeat_rule = (data.get('repeat_rule') or "").strip() or None
        repeat_interval = int(data.get('repeat_interval') or 1)
        is_active = bool(data.get('is_active', True))

        if not title or not scheduled_at or not channels:
            return _err("title, scheduled_at and channels are required", 400)

        try:
            when = datetime.fromisoformat(scheduled_at)
        except Exception:
            return _err("scheduled_at must be ISO datetime string", 400)

        new_reminder = Reminder(
            user_id=current_user.id,
            title=title,
            description=description,
            scheduled_at=when,
            repeat_rule=repeat_rule,
            repeat_interval=repeat_interval,
            is_active=is_active,
            channels=channels,
            recipient_email=recipient_email,
            next_run_at=when,
            media_paths=[],
            reminder_type=reminder_type
        )

        try:
            db.session.add(new_reminder)
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            return jsonify({"message":str(e)}),400

        return _ok({
            "ok": True,
            "data": new_reminder.to_json()
        }, 201)


    @app.route('/api/update_reminder/<int:rid>',methods=['PATCH'])
    @login_required
    def update_reminder(rid):
        reminder = Reminder.query.filter_by(rid=rid, user_id=current_user.id).first()
        if not reminder:
            return _err("reminder not found", 404)

        data = request.get_json() or {}

        for k in ("title", "description", "recipient_email", "repeat_rule", "reminder_type"):
            if k in data:
                setattr(reminder, k, (data[k] or "").strip() or None)

        if "channels" in data:
            if data["channels"] is None:
                reminder.channels = []
            elif isinstance(data["channels"], list):
                reminder.channels = data["channels"]
            else:
                return _err("channels must be a list", 400)

        if "scheduled_at" in data and data["scheduled_at"]:
            try:
                reminder.scheduled_at = datetime.fromisoformat(data["scheduled_at"])
                reminder.next_run_at = reminder.scheduled_at
            except Exception:
                return _err("scheduled_at must be ISO datetime string", 400)

        if "repeat_interval" in data:
            try:
                reminder.repeat_interval = int(data["repeat_interval"])
            except Exception:
                return _err("repeat_interval must be int", 400)

        if "is_active" in data:
            reminder.is_active = bool(data["is_active"])

        # Alarm completed or snooze reminder
        if data.get("action") == "done":
            reminder.last_sent_at = datetime.utcnow()
        if data.get("action") == "snooze":
            reminder.next_run_at = (reminder.next_run_at or datetime.utcnow()) + timedelta(minutes=10)

        reminder.updated_at = datetime.utcnow()
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return _err(str(e), 400)

        return _ok({
            "ok": True,
            "data": reminder.to_json()
        })


    @app.route('/api/delete_reminder/<int:rid>',methods=['DELETE'])
    @login_required
    def delete_reminder(rid):
        reminder = Reminder.query.filter_by(rid=rid, user_id=current_user.id).first()
        if not reminder:
            return _err("reminder not found",404)
        try:
            db.session.delete(reminder)
            db.session.commit()
        except Exception as e:
            db.session.rollback()   # Rollback transaction to avoid session pollution
            return _err(str(e), 400)

        return _ok({"message": "deleted"})


    def allowed_file(filename):
        ext = os.path.splitext(filename)[1].lower().lstrip(".")
        return ext in (app.config.get("ALLOWED_EXTENSIONS") or set())

    @app.route('/api/upload_reminders/<int:rid>/', methods=['POST'])
    @login_required
    def upload_media(rid):
        reminder = Reminder.query.filter_by(rid=rid, user_id=current_user.id).first()
        if not reminder:
            return _err("reminder not found", 404)
        if 'file' not in request.files:
            return _err("file is required", 400)

        f = request.files['file']
        if not f.filename:
            return _err("empty filename", 400)

        max_len = app.config.get("MAX_CONTENT_LENGTH")
        if max_len and (request.content_length or 0) > max_len:
            return _err(f"file too large (>{max_len} bytes)", 413)

        # Whitelist validation
        if not allowed_file(f.filename):
            return _err("file type not allowed", 400)

        folder = app.config.get("UPLOAD_FOLDER", "uploads")
        os.makedirs(folder, exist_ok=True)
        ext = os.path.splitext(f.filename)[1].lower()
        fname = f"{uuid.uuid4().hex}{ext}"
        safe_name = secure_filename(fname)
        path = os.path.join(folder, safe_name)
        f.save(path)

        try:
            reminder.media_paths = (reminder.media_paths or []) + [path]
            reminder.updated_at = datetime.utcnow()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            # Saved files can be deleted here to avoid "saved but not written to DB", here's the approach:
            try:
                os.remove(path)
            except Exception:
                pass
            return _err(str(e), 400)

        return _ok({"path": path}, 201)     # Frontend temporarily cannot access due to no file path, can test on backend


    @app.route("/api/test_send_email", methods=["POST"])
    def test_send_email():
        data = request.get_json(force=True, silent=True) or {}
        to_addr = data.get("to") or os.getenv("DEFAULT_RECIPIENT")
        subject = data.get("subject") or "Hello from Memory Coach"
        body = data.get("body") or "This is a test email."

        if not to_addr:
            return _err("missing 'to' (or set DEFAULT_RECIPIENT in .env)", 400)

        try:
            # Key: Use UTF-8 for subject and entire email
            safe_subject = str(Header(subject, "utf-8"))
            msg = Message(              #encapsulate an email message
                subject=safe_subject,
                recipients=[to_addr],
                body=body,
                sender=str(Header(app.config.get("MAIL_DEFAULT_SENDER"), "utf-8")),
                charset="utf-8",
            )

            mail.send(msg)
            return _ok({"sent": True, "to": to_addr})
        except Exception as e:
            # Print complete error stack for easy error source location (email header issue)
            app.logger.exception("send_mail_failed")
            return jsonify({
                "error": e.__class__.__name__,
                "detail": str(e),
                "trace": traceback.format_exc(),
            }), 400


    @app.route("/api/test_alarm/<int:rid>", methods=["GET"])
    @login_required
    def test_alarm(rid):
        r = Reminder.query.filter_by(rid=rid, user_id=current_user.id).first()
        if not r:
            return _err("reminder not found", 404)

        # Choose available audio (return DEFAULT if not uploaded, frontend uses built-in sound)
        sound = None
        for p in (r.media_paths or []):
            if os.path.splitext(p)[1].lower() in {".mp3", ".wav", ".ogg"} and os.path.exists(p):
                sound = p
                break
        return _ok({"sound": sound or "DEFAULT"})


    @app.route("/api/test_send_email/<int:rid>", methods=["POST"])
    @login_required
    def test_send_email_rid(rid):
        r = Reminder.query.filter_by(rid=rid, user_id=current_user.id).first()
        if not r:
            return _err("reminder not found", 404)

        data = request.get_json(force=True, silent=True) or {}
        to_addr = (data.get("to") or r.recipient_email or os.getenv("DEFAULT_RECIPIENT") or "").strip()
        if not to_addr:
            return _err("missing recipient (set 'to' or 'recipient_email' or DEFAULT_RECIPIENT)", 400)

        when = (r.scheduled_at.isoformat() if r.scheduled_at else "")
        rep = ""
        if r.repeat_rule and r.repeat_rule != "NONE":
            rep = f"\nFrequency：{r.repeat_rule} x{r.repeat_interval}"

        body_lines = []
        if r.description:
            body_lines.append(r.description)
        if when:
            body_lines.append(f"Time：{when}")
        if rep:
            body_lines.append(rep.strip())
        if not body_lines:
            body_lines.append("This is a reminder")

        body_text = "\n".join(body_lines)

        try:
            # Avoid 'ascii' error
            safe_subject = str(Header(f"[Reminder] {r.title or 'Nontitle'}", "utf-8"))
            msg = Message(
                subject=safe_subject,
                recipients=[to_addr],
                body=body_text,
                sender=app.config.get("MAIL_DEFAULT_SENDER"),
                charset="utf-8",
            )
            msg.charset = "utf-8"

            mail.send(msg)

            # Optional: Write back send time
            r.last_sent_at = datetime.utcnow()
            db.session.commit()
            return _ok({"sent": True, "to": to_addr})
        except Exception as e:
            db.session.rollback()
            app.logger.exception("send_mail_failed")
            return jsonify({"error": e.__class__.__name__, "detail": str(e)}), 40


    # Handle OPTIONS (preflight) requests before formal POST requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")    # Tell browser to allow all origins
            response.headers.add('Access-Control-Allow-Headers', "*")    # Allow all request headers
            response.headers.add('Access-Control-Allow-Methods', "*")     # Allow all request methods
            return response