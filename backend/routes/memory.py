from flask import jsonify,request,make_response
from flask_login import login_required, current_user
from backend.config import db
from backend.models.memory_model import Memories
from datetime import datetime


# Backend API definition core: Put similar functionality "memory cards (memories)" under the same URL namespace, use HTTP methods to express actions
def _ok(payload,status=200):
    return jsonify(payload),status

def _err(message,status=400):
    return jsonify({"error":message}),status

def register(app):
    @app.route('/api/get_memory',methods=['GET'])
    @login_required
    def get_memory():
        memory = Memories.query.filter_by(user_id=current_user.id).order_by(Memories.created_at.desc()).all()
        json_memories = list(map(lambda x: x.to_json(), memory))
        return _ok({
            "ok": True,
            "data": json_memories
        })

    @app.route('/api/create_memory', methods=['POST','OPTIONS'])
    @login_required
    def add_memory():
        if request.method == "OPTIONS":
            pass

        data=request.get_json()
        title=(data.get("title") or "").strip()
        content=(data.get("content") or "").strip()
        # content can come from handwriting or speech-to-text, so content must exist but voice_file_path can be None
        if not content or not title:
            return _err("title and content are required", 400)

        tags = data.get("tags") or []
        if not isinstance(tags, list):
            return _err("tags must be a list", 400)

        is_favorite=bool(data.get("is_favorite",False))
        voice_file_path=data.get("voice_file_path")

        new_memory=Memories(user_id=current_user.id,title=title,content=content,tags=tags,voice_file_path=voice_file_path,is_favorite=is_favorite)

        try:
            db.session.add(new_memory)
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            return _err(str(e),400)

        return _ok({
            "ok": True,
            "data": new_memory.to_json()
        }, 201)


    @app.route('/api/update_memory/<int:memory_id>',methods=['PATCH'])
    @login_required
    def update_memory(memory_id):
        memory = Memories.query.filter_by(id=memory_id, user_id=current_user.id).first()
        if not memory:
            return _err("memory not found",400)

        data = request.get_json()

        if "title" in data and isinstance(data["title"], str):
            memory.title = data["title"].strip() or memory.title

        if "content" in data and isinstance(data["content"], str):
            memory.content = data["content"].strip() or memory.content

        if "tags" in data:
            if data["tags"] is None:
                memory.tags = []
            elif isinstance(data["tags"], list):
                memory.tags = data["tags"]
            else:
                return _err("tags must be a list", 400)

        if "is_favorite" in data:
            memory.is_favorite = bool(data["is_favorite"])

        if "voice_file_path" in data:
            # Allow setting to None
            memory.voice_file_path = data["voice_file_path"]


        memory.updated_at = datetime.utcnow()

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return _err(str(e), 400)

        return _ok({
            "ok": True,
            "data": memory.to_json()
        })


    @app.route('/api/delete_memory/<int:memory_id>',methods=['DELETE'])
    @login_required
    def delete_memory(memory_id):
        memory = Memories.query.filter_by(id=memory_id, user_id=current_user.id).first()
        if not memory:
            return _err("memory not found",404)

        try:
            db.session.delete(memory)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return _err(str(e), 400)

        return _ok({
            "ok": True,
            "data": {"message": "deleted"}
        }, 200)

    # Handle OPTIONS (preflight) requests before formal POST requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")    # Tell browser to allow all origins
            response.headers.add('Access-Control-Allow-Headers', "*")    # Allow all request headers
            response.headers.add('Access-Control-Allow-Methods', "*")     # Allow all request methods
            return response
