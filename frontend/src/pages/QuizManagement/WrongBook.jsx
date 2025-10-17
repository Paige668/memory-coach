// src/pages/WrongBook.jsx
import { useEffect, useState } from 'react';
import { fetchWrong } from '../../services/quizService';
import { Box, Card, CardContent, Typography } from '@mui/material';

export default function WrongBook() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchWrong().then(setItems).catch(() => alert('Please log in first.'));
  }, []);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Wrong Questions (Review)</Typography>

      {(!items || items.length === 0) && (
        <Typography sx={{ color: '#666' }}>No wrong questions yet.</Typography>
      )}

      {(items || []).map((w) => (
        <Card key={w.id || `${w.attempt_id}-${w.question_id}`} sx={{ mb: 2.5, borderRadius: '18px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1.2 }}>{w.question_text}</Typography>
            <ol style={{ paddingLeft: 18, marginTop: 6 }}>
              {w.options.map((opt, i) => (
                <li key={i} style={{ margin: '4px 0' }}>
                  {opt}
                </li>
              ))}
            </ol>
            <Typography sx={{ mt: 1, color: '#2e7d32', fontWeight: 600 }}>
              Correct answer: #{w.correct_index}
            </Typography>
            {w.explanation && <Typography sx={{ mt: .5, color: '#555' }}>{w.explanation}</Typography>}
            {w.source_url && (
              <a href={w.source_url} target="_blank" rel="noreferrer">source</a>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}