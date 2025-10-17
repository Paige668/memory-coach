from flask import Flask,jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from flask_mail import Mail
from flask_login import LoginManager
from datetime import timedelta


mail=Mail()
db=SQLAlchemy()    # Create database object


def create_app():
    app = Flask(__name__)
    CORS(app,supports_credentials=True)
    app.config['DEV_LOGIN_ENABLED'] = True  # Quick login for development

    from backend.routes import memory
    from backend.routes import reminder
    from backend.routes import registration
    from backend.routes import quiz
    from backend.routes import profile
    memory.register(app)
    reminder.register(app)
    registration.register(app)
    quiz.register(app)
    profile.register(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(app.instance_path, "mydatabase.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    uploads_dir = os.path.join(app.instance_path, "uploads")  # uploads directory absolute path
    os.makedirs(uploads_dir, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, 'uploads')         # Create uploads directory under instance
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB
    app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg", "gif", "webp","mp3","wav","ogg"}

    from dotenv import load_dotenv
    load_dotenv()

    app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-change-me')

    login_manager = LoginManager()
    login_manager.init_app(app)

    from backend.models.user_model import User

    @login_manager.user_loader
    def load_user(uid):
        user = User.query.get(int(uid))
        print(f"Loading user: {user}, type: {type(user)}")  # Debug info
        return user

    # Define behavior when user is unauthorized
    @login_manager.unauthorized_handler
    def unauthorized_callback():
        return jsonify({"error": "unauthorized"}), 401



    app.config.update({
        # Default to Gmail; override the following two items to change provider
        "MAIL_SERVER": os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        "MAIL_PORT": int(os.getenv("MAIL_PORT", "587")),
        "MAIL_USE_TLS": True,
        "MAIL_USERNAME": os.getenv("SENDER_EMAIL"),
        "MAIL_PASSWORD": os.getenv("SENDER_APP_PASSWORD"),
        "MAIL_DEFAULT_SENDER": os.getenv("SENDER_EMAIL"),
        "MAIL_USE_SSL": False,
        'REMEMBER_COOKIE_DURATION' : timedelta(days=180),  # Remember me for 180 days
        'REMEMBER_COOKIE_SAMESITE' : 'Lax',
        'REMEMBER_COOKIE_SECURE' : False,  # False for local debug; True for production https
        'SESSION_COOKIE_SAMESITE' : 'Lax',
        'SESSION_COOKIE_SECURE' : False  # True for production https

    })
    app.config['MAIL_ASCII_ATTACHMENTS'] = False


    mail.init_app(app)

    db.init_app(app)      # Bind database and application

    migrate = Migrate(app, db)

    return app

