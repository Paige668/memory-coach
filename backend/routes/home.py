# Responsible for aggregating data from various sections and returning to frontend, no modifications or additions/deletions
# Data migration commands: first set environment, then flask --app backend.app db migrate -m "add reminders table"      flask --app backend.app db upgrade


from backend.app import app


@app.route('/home')
def home():
    pass
