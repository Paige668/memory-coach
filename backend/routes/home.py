#负责从各个板块聚合数据返回给前端，不进行修改或者增删

from app import app
from config import db
from routes.reminder import get_reminders
from routes.memory import get_memory

@app.route('/home')
def home():
    pass
