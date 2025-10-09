from flask import jsonify
from ..config import app,db
from ..models import Memories

@app.route('/get_memory')
def get_memory():
    memories=Memories.query.all()
    json_memories=list(map(lambda x:x.to_json(),memories))
    return jsonify({"memories": json_memories})

