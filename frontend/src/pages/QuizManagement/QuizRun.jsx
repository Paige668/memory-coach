// src/pages/QuizRun.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkQuiz, submitQuiz } from '../../services/quizService';
import { Box, Card, CardContent, Typography, Button, Divider } from '@mui/material';

function QuestionCard({ q, displayIndex, value, setValue, feedback, onCheck, locked }) {
  return (
    <Card sx={{ mb: 3, borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Q{displayIndex}. {q.text}</Typography>
        {q.options.map((opt, idx) => (
          <label key={idx} style={{ display: 'flex', gap: 8, padding: '6px 0' }}>
            <input
                type="radio"
                name={`q-${q.qid}`}
                checked={value === idx}
                onChange={() => setValue(idx)}
                disabled={locked}
             />
            <span>{opt}</span>
          </label>
        ))}
        <Box sx={{mt: 1.5, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
           size="small"
           variant="contained"
           onClick={() => onCheck(q.qid, value)}
           disabled={locked || value === undefined}
           sx={{
              borderRadius: '12px',
              bgcolor: 'success.light',
              color: 'success.contrastText',
              '&:hover': { bgcolor: 'success.main' },
              '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.600' }
            }}
          >
          {locked ? 'Checked' : 'Check'}
         </Button>
          {feedback && (
            <Typography sx={{ color: feedback.correct ? '#2e7d32' : '#d32f2f' }}>
              {feedback.correct ? 'Correct.' : `Incorrect. Correct option is #${feedback.correct_index}.`} {q.explanation}
              {q.source_url && <> <a href={q.source_url} target="_blank" rel="noreferrer">source</a></>}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function QuizRun() {
  const nav = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [qs, setQs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('quiz.run');
    if (!raw) { nav('/quiz'); return; }
    const data = JSON.parse(raw);
    setAttempt(data.attempt_id);
    setQs(data.questions || []);
  }, [nav]);

  const setSel = (qid, idx) => setAnswers(prev => ({ ...prev, [qid]: idx }));

  async function onCheck(qid, idx) {
    if (idx === undefined) return;
    try {
      const res = await checkQuiz(qid, idx);
      setFeedbacks(prev => ({ ...prev, [qid]: res }));
    } catch {
      alert('Please log in first.');
    }
  }

  async function onSubmit() {
    const payload = Object.entries(answers).map(([qid, idx]) => ({
      question_id: Number(qid), selected_index: Number(idx)
    }));
    try {
      setSubmitting(true);
      const res = await submitQuiz(attempt, payload);
      setSubmitting(false);
      setResult(res); // {score,total}
    } catch {
      setSubmitting(false);
      alert('Please log in first.');
    }
  }

  if (!qs.length) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Caregiver Quiz</Typography>
      {qs.map((q, idx) => (
        <QuestionCard key={q.qid} q={q} displayIndex={idx + 1}
          value={answers[q.qid]}
          setValue={(v) => setSel(q.qid, v)}
          feedback={feedbacks[q.qid]}
          onCheck={onCheck}
          locked={!!feedbacks[q.qid]}
        />
      ))}

      <Divider sx={{ my: 2 }} />
      <Button variant="contained" disabled={submitting} onClick={onSubmit}
              sx={{ borderRadius: '14px', px: 4, py: 1.4 }}>
        {submitting ? 'Submitting...' : 'Submit'}
      </Button>

      {result && (
        <Typography sx={{ mt: 2, fontWeight: 600 }}>
          Score: {result.score} / {result.total}
          &nbsp;—&nbsp;
          <a href="/quiz/wrong-book">Review wrong questions</a>
        </Typography>
      )}
    </Box>
  );
}
