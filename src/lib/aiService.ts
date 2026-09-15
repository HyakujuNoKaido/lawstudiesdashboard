export async function generateCaseLaw(atfCitation: string) {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate_case_law', payload: { citation: atfCitation } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur de l'IA");
  return data;
}

export async function generateSubsumption(factsAndLegalIssue: string) {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate_subsumption', payload: { facts: factsAndLegalIssue } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur de l'IA");
  return data;
}

export async function generateMockExam(topic: string) {
  const response = await fetch('/api/gemini-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate_mock_exam', payload: { topic } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur de l'IA");
  return data;
}
