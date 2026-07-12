export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { config: c } = req.body;
  if (!c) return res.status(400).json({ error: 'No config provided' });

  const prompt = `
You are an expert nonprofit funding strategist with deep knowledge of grant-making, charitable trusts, government funding, and fundraising strategy globally. A small nonprofit has shared their situation with you. Generate a specific, actionable funding roadmap tailored entirely to their situation.

Here is their data:
- Organisation: ${c.org}
- Contact: ${c.name}
- Country / Region: ${c.country}
- Cause area: ${c.cause}
- Project: ${c.project}
- Funding needed: ${c.amount}
- Funding type: ${c.fundingType}
- Timeframe: ${c.timeframe}
- Beneficiaries: ${c.beneficiaries}
- Stage: ${c.stage}
- Annual income: ${c.income}
- Existing funding: ${c.existingFunding}
- Biggest challenge: ${c.challenge}
- Governance status: ${c.governance}
- Accounts status: ${c.accounts}
- Evidence of impact: ${c.evidence}
- Biggest strength: ${c.strength}

Return only a valid JSON object, no preamble, no markdown, no backticks:

{
  "insightQuote": "One powerful sentence spoken directly to ${c.name} about their specific funding situation. Reference their actual project, cause, and country. Max 45 words. Be honest and direct.",
  "strengths": [
    {"key": "label", "value": "specific finding", "pill": "green or null"}
  ],
  "gaps": [
    {"key": "label", "value": "specific finding", "pill": "red or null"}
  ],
  "readiness": [
    {"key": "label", "value": "specific finding", "pill": "green or red or null"}
  ],
  "quickWins": [
    {"key": "label", "value": "specific action", "pill": null}
  ],
  "fundingMatrix": [
    {
      "type": "Funding source name",
      "difficulty": "Easy or Medium or Hard",
      "timeToSecure": "e.g. 2–4 months",
      "potentialValue": "e.g. Low / Medium / High / Very High",
      "priority": 5
    }
  ],
  "matrixInsight": "One sentence explaining the priority order for this specific organisation. Reference their cause, country, and stage.",
  "phases": [
    {
      "label": "Month 1 · Phase name",
      "title": "Phase title",
      "goal": "What success looks like at the end of this phase",
      "actions": [
        {
          "title": "Specific action title",
          "desc": "Detailed description referencing their specific project, cause, and situation",
          "priority": "now or soon or later"
        }
      ]
    }
  ],
  "pipeline": [
    {
      "title": "Pipeline stage name",
      "desc": "One line describing what happens at this stage"
    }
  ],
  "pipelineInsight": "One sentence about the funding journey specific to this organisation's cause and country."
}

Rules:
- Each of strengths, gaps, readiness, quickWins must have exactly 4 items
- fundingMatrix must have 6–8 rows relevant to their cause area and country — use country-specific funding sources where possible
- phases must have exactly 3 phases with exactly 4 actions each
- pipeline must have 6–8 steps
- pill must be exactly "red", "green", or null
- priority in fundingMatrix must be a number 1–5
- priority in actions must be exactly "now", "soon", or "later"
- Every single item must reference the organisation's specific situation, project, cause area, country, or beneficiaries — nothing generic
- For the funding matrix, name actual relevant funding types for their country and cause — e.g. for UK housing use Homes England, National Lottery Community Fund, housing trusts. For US use CDFI, HUD, foundations. For Nigeria use TY Danjuma Foundation, government grants etc.
- Return only the JSON object, nothing else
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Taigerlily API error:', error);
    return res.status(500).json({ error: 'Failed to generate roadmap' });
  }
}
