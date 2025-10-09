from ..config import app,db
from flask import request,jsonify,make_response
from ..models import Reminder

#新增/删除提醒任务
@app.route('/reminder',methods=['GET'])
def get_reminders():
    reminders = Reminder.query.all()    #contacts is like a list of Contact objects
    json_reminders = list(map(lambda x:x.to_json(),reminders))
    return jsonify({"reminders":json_reminders})

@app.route('/create_reminder',methods=['POST','OPTIONS'])
def create_reminder():
    if request.method == "OPTIONS":
        #预检请求
        return 200

    data = request.get_json()
    description = data.get('description')      #任务描述
    time = data.get('time')         #任务时间
    date = data.get('date')
    is_completed = data.get('is_completed')        #完成了没有

    if not description or not time or not date or not is_completed:
        return (
            jsonify({'message':"You must specify what is the task and when to do it."}),
            400,
        )

    new_reminder = Reminder(description=description, time=time, date=date,is_completed=is_completed)
    try:
        db.session.add(new_reminder)
        db.session.commit()

    except Exception as e:
        return jsonify({"message":str(e)}),400

    return jsonify({"message":"Reminder created"}),201


@app.route('/update_reminder/<int:user_id>',methods=['PATCH'])
def update_reminder(user_id):
    #这里的逻辑是update reminder和create reminder共用一个表格，如果用户update后http request有新的数据产生，那么后端update,否则保持不变。
    reminder = Reminder.query.get(user_id)
    if not reminder:
        return jsonify({'message':"User not found"}), 404

    data = request.get_json()

    reminder.description=data.get("description",reminder.description)
    reminder.time=data.get("time",reminder.time)
    reminder.date=data.get("date",reminder.date)
    reminder.is_completed=data.get("is_completed",reminder.is_completed)

    db.session.commit()

    return jsonify({"message":"Reminder updated"}), 200


@app.route('/delete_reminder/<int:user_id>',methods=['DELETE'])
def delete_reminder(user_id):
    reminder = Reminder.query.get(user_id)
    if not reminder:
        return jsonify({'message':"User not found"}),404

    db.session.delete(reminder)
    db.session.commit()

    return jsonify({"message":"Reminder deleted"}), 200

#处理正式POST请求之前浏览器的OPTIONS(预检)请求
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")    #告诉浏览器允许所有来源
        response.headers.add('Access-Control-Allow-Headers', "*")    #允许所有请求头
        response.headers.add('Access-Control-Allow-Methods', "*")     #允许所有请求方法
        return response