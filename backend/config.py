from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate

db=SQLAlchemy()    #创建数据库

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key="SOME KEY"

    db.init_app(app)      #初始化APP数据库

    migrate = Migrate(app, db)

    return app

if __name__=='__main__':
    app=create_app()
    app.run(host='0.0.0.0',debug=True,port=5000)