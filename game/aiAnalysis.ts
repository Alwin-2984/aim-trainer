export async function analyzePerformance(params: {
  modeName: string;
  score: number;
  accuracy: string;
  sensitivity: number;
  isTrackingMode: boolean;
}): Promise<string> {
  const prompt = `
    I just finished a 60-second aim training session.
    Scenario: ${params.modeName}
    Stats:
    - Score: ${params.score} ${params.isTrackingMode ? '(Frames Tracked)' : '(Targets Hit)'}
    - Accuracy: ${params.isTrackingMode ? 'N/A (Tracking)' : params.accuracy + '%'}
    - Sensitivity: ${params.sensitivity} (CS2)

    Act as a professional Esports Aim Coach.
    1. Assessment: 1 sentence on my performance.
    2. Advice: 1 specific, actionable drill or tip for ${params.modeName}.
    3. Keep response under 60 words.
  `;

  const apiKey = '';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) throw new Error('API Error');
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  return `<h3><span style="font-size:1.4em">\u{1F916}</span> Coach's Feedback</h3>${formattedText}`;
}
