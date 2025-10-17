// src/services/quizService.js
const BASE = ''; // Leave empty for same-origin deployment; change to 'http://127.0.0.1:5000' if frontend and backend ports differ

async function get(url) {
  const r = await fetch(BASE + url, { credentials: 'include' });
  if (r.status === 401) throw new Error('Unauthorized');
  return r.json();
}

async function post(url, body) {
  const r = await fetch(BASE + url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (r.status === 401) throw new Error('Unauthorized');
  return r.json();
}

export const createQuiz = (count = 5) => get(`/api/create_quiz?count=${count}`);
export const checkQuiz  = (qid, selected_index) => post('/api/check_quiz', { question_id: qid, selected_index });
export const submitQuiz = (attempt_id, answers) => post('/api/submit_quiz', { attempt_id, answers });
export const fetchWrong = () => get('/api/wrong_quiz');
