// src/pages/Quiz.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../../services/quizService';
import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material';

// Unified style: Start / Open Wrong Book use the same button set (consistent with site-wide style)
const primaryBtnSx = {
  borderRadius: '14px',
  px: 4,
  py: 1.4,
  color: '#fff',
  background: 'linear-gradient(135deg,#7B5BA6 0%, #A98BBD 100%)',
  boxShadow: '0 8px 20px rgba(123,95,163,0.35)',
  textTransform: 'none',
  fontWeight: 700,
  '&:hover': { opacity: 0.95, background: 'linear-gradient(135deg,#6F4E98 0%, #9D7FB3 100%)' },
};



export default function QuizLanding() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function onStart() {
    try {
      setErr(''); setLoading(true);
      const data = await createQuiz(5);
      setLoading(false);
      if (!data?.questions?.length) {
        setErr('No questions in the bank. Please seed first.');
        return;
      }
      sessionStorage.setItem('quiz.run', JSON.stringify(data)); // {attempt_id, questions:[...]}
      navigate('/quiz/run');
    } catch {
      setLoading(false);
      setErr('Please log in first.');
    }
  }

  return (
    <Grid sx={{ maxWidth: '100%', mx: 'auto', p: 3 }}>
    {/* Hero: Same as MemoryManagement's light background large card */}
    <Box sx={{
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      borderRadius: 3,
      p: 4,
      mb: 4,
      border: '1px solid #E0E0E0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(255, 152, 0, 0.03) 100%)',
        pointerEvents: 'none',
      }
    }}>
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Typography
        variant="h2"
        component="h1"
        sx={{
          fontWeight: 900,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #FF8C00 0%, #1E90FF 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          textAlign: 'center',
          mb: 2,
          textShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        Caregiver Quiz (Alzheimer's)
      </Typography>

    {/* Underline decorative bar */}
    <Box sx={{
      width: 100,
      height: 4,
      background: 'linear-gradient(135deg, #FF8C00 0%, #1E90FF 100%)',
      borderRadius: 2,
      mx: 'auto',
      mb: 2
    }} />

    <Typography sx={{ color: '#6b6b6b', textAlign: 'center' }}>
      5 randomized single-choice questions. Check each item, then submit to see your score.
    </Typography>
  </Box>
</Box>



      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left: Brighter orange (energetic, lighter) */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            borderRadius: 5,
            p: { xs: 3, md: 5 },
            height: '100%',
            background: 'linear-gradient(135deg,#FFE8BF 0%, #FFC372 100%)', // Brighter and lighter
            boxShadow: '0 12px 30px rgba(255,170,80,0.25)',
            position: 'relative',
            pb: { xs: 10, md: 12 } // Reserve bottom space for fixed button
          }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#3b2000', mb: 1.5, fontSize: { xs: '1.6rem', md: '2rem' }, letterSpacing: '-0.02em' }}>
              Start Quiz
            </Typography>
            <Typography sx={{ color: '#3b2000', opacity: 0.9, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' } }}>
              Begin a new attempt. Questions refresh every time.
            </Typography>
            <Box sx={{ position: 'absolute', left: { xs: 24, md: 40 }, bottom: { xs: 24, md: 32 } }}>
              <Button
                variant="contained"
                disabled={loading}
                onClick={onStart}
                sx={primaryBtnSx}
              >
                {loading ? 'Starting...' : 'Start'}
              </Button>
            </Box>
            {err && <Typography sx={{ color: '#5a1a01', mt: 2 }}>{err}</Typography>}
          </Box>
        </Grid>

        {/* Right: Brighter blue (distinct from button's purple) */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            borderRadius: 5,
            p: { xs: 3, md: 5 },
            height: '100%',
            background: 'linear-gradient(135deg,#6EC1E4 0%, #9ED7F2 100%)', // Bright blue
            color: '#0E3A5D',
            boxShadow: '0 12px 30px rgba(110,193,228,0.28)',
            position: 'relative',
            pb: { xs: 10, md: 12 }
          }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1.5, fontSize: { xs: '1.6rem', md: '2rem' }, letterSpacing: '-0.02em' }}>
              Wrong Questions
            </Typography>
            <Typography sx={{ opacity: 0.95, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' } }}>
              Review your mistakes. Each card shows the full question and the right answer.
            </Typography>
          <Box sx={{ position: 'absolute', left: { xs: 24, md: 40 }, bottom: { xs: 24, md: 32 } }}>
            <Button
              variant="contained"
              onClick={() => navigate('/quiz/wrong-book')}
              sx={primaryBtnSx}   // Consistent with Start
            >
              Open Wrong Book
            </Button>
          </Box>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
}
