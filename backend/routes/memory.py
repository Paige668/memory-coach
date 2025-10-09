from flask import jsonify
from config import db
from app import app
from models.memory_model import Memories

@app.route('/get_memory')
def get_memory():
    memories=Memories.query.all()
    json_memories=list(map(lambda x:x.to_json(),memories))
    return jsonify({"memories": json_memories})

