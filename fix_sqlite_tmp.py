import sqlite3
db = "mydatabase.db"
con = sqlite3.connect(db)
cur = con.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '_alembic_tmp_%'")
rows = [r[0] for r in cur.fetchall()]
for t in rows:
    con.execute(f'DROP TABLE IF EXISTS {t}')
con.commit()
con.close()
print("Dropped:", rows or "None")
