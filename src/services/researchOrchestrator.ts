import { tavilySearch } from './tavily';
import type { ResearchSession, ResearchStep, ResearchSource } from '../store/researchStore';

type StreamChunk = { type: 'content' | 'thinking'; text: string };
type StreamFn = (messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) => AsyncGenerator<StreamChunk>;

const MAX_ITERATIONS = 3;
const MAX_SOURCES = 15;
const SOURCE_CONTENT_LIMIT = 3000;

function stepId(): string {
  return crypto.randomUUID();
}

async function aiComplete(
  streamFn: StreamFn,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];
  let result = '';
  const stream = streamFn(messages);
  for await (const chunk of stream) {
    if (signal?.aborted) throw new Error('Research aborted');
    if (chunk.type === 'content') result += chunk.text;
  }
  return result.trim();
}

export async function runResearch(
  session: ResearchSession,
  apiKey: string,
  streamFn: StreamFn,
  store: {
    updateSession: (id: string, patch: Partial<ResearchSession>) => void;
    addStep: (sessionId: string, step: ResearchStep) => void;
    updateStep: (sessionId: string, stepId: string, patch: Partial<ResearchStep>) => void;
    addSource: (sessionId: string, source: ResearchSource) => void;
    addFact: (sessionId: string, fact: string) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  const sid = session.id;
  const seenUrls = new Set<string>();

  try {
    let iteration = 0;
    let currentQuery = session.query;

    while (iteration < MAX_ITERATIONS) {
      if (signal?.aborted) throw new Error('Research aborted');

      // --- PLAN ---
      const planStepId = stepId();
      store.addStep(sid, { id: planStepId, type: 'plan', status: 'running', detail: 'Generating search queries...' });
      store.updateSession(sid, { status: 'planning' });

      const planPrompt = iteration === 0
        ? `Research topic: "${currentQuery}"\n\nGenerate 3-5 specific search queries that would yield comprehensive information about this topic. Output one query per line, nothing else.`
        : `Research topic: "${session.query}"\nFacts gathered so far:\n${session.facts.map((f) => `- ${f}`).join('\n')}\n\nWe need more information. Generate 2-3 NEW search queries that would fill gaps in our knowledge. Focus on aspects not yet covered. Output one query per line, nothing else.`;

      const planResult = await aiComplete(
        streamFn,
        'You are a research planner. Generate specific, focused search queries. Output one query per line, nothing else. No numbering, no bullets.',
        planPrompt,
        signal,
      );

      const queries = planResult.split('\n').map((q) => q.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      store.updateStep(sid, planStepId, { status: 'done', detail: `Generated ${queries.length} search queries` });

      if (queries.length === 0) {
        if (iteration === 0) throw new Error('Could not generate search queries');
        break;
      }

      // --- SEARCH ---
      const searchStepId = stepId();
      store.addStep(sid, { id: searchStepId, type: 'search', status: 'running', detail: `Searching ${queries.length} queries...` });
      store.updateSession(sid, { status: 'searching' });

      let totalNewSources = 0;
      for (const q of queries) {
        if (signal?.aborted) throw new Error('Research aborted');
        try {
          const response = await tavilySearch(apiKey, q, { searchDepth: 'advanced', maxResults: 5, includeRawContent: true });
          for (const result of response.results) {
            if (seenUrls.has(result.url)) continue;
            if (session.sources.length + totalNewSources >= MAX_SOURCES) break;
            seenUrls.add(result.url);
            totalNewSources++;

            const source: ResearchSource = {
              id: crypto.randomUUID(),
              title: result.title,
              url: result.url,
              snippet: result.content,
              facts: [],
              fetchedAt: Date.now(),
            };
            store.addSource(sid, source);
          }
        } catch (err) {
          console.error(`[research] Search failed for "${q}":`, err);
        }
      }
      store.updateStep(sid, searchStepId, { status: 'done', detail: `Found ${totalNewSources} new sources`, sourcesFound: totalNewSources });

      if (totalNewSources === 0 && iteration > 0) break;

      // --- READ & EXTRACT ---
      const readStepId = stepId();
      store.addStep(sid, { id: readStepId, type: 'read', status: 'running', detail: 'Extracting key facts from sources...' });
      store.updateSession(sid, { status: 'reading' });

      // Re-read session to get updated sources
      const updatedSources = ((): ResearchSource[] => {
        try {
          const storeState = (store as unknown as { getState?: () => { sessions: ResearchSession[] } });
          if (storeState.getState) {
            const s = storeState.getState().sessions.find((ss: ResearchSession) => ss.id === sid);
            if (s) return s.sources;
          }
        } catch { /* ignore */ }
        return session.sources;
      })();

      let newFactsCount = 0;
      for (const source of updatedSources) {
        if (signal?.aborted) throw new Error('Research aborted');
        if (source.facts.length > 0) continue;

        const content = (source.snippet || '').slice(0, SOURCE_CONTENT_LIMIT);
        if (!content) continue;

        try {
          const extractResult = await aiComplete(
            streamFn,
            'Extract 2-5 key facts from the provided content that are relevant to the research topic. Output one fact per line. Be specific, include names, numbers, dates. No bullets, no numbering.',
            `Research topic: "${session.query}"\n\nSource: ${source.title}\nURL: ${source.url}\nContent:\n${content}`,
            signal,
          );

          const facts = extractResult.split('\n').map((f) => f.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
          for (const fact of facts) {
            store.addFact(sid, fact);
            newFactsCount++;
          }
        } catch (err) {
          console.error(`[research] Extract failed for "${source.title}":`, err);
        }
      }
      store.updateStep(sid, readStepId, { status: 'done', detail: `Extracted ${newFactsCount} new facts` });

      // --- EVALUATE ---
      const evalStepId = stepId();
      store.addStep(sid, { id: evalStepId, type: 'evaluate', status: 'running', detail: 'Evaluating if more research needed...' });
      store.updateSession(sid, { status: 'evaluating' });

      // Re-read facts
      const currentFacts = ((): string[] => {
        try {
          const storeState = (store as unknown as { getState?: () => { sessions: ResearchSession[] } });
          if (storeState.getState) {
            const s = storeState.getState().sessions.find((ss: ResearchSession) => ss.id === sid);
            if (s) return s.facts;
          }
        } catch { /* ignore */ }
        return session.facts;
      })();

      if (iteration >= MAX_ITERATIONS - 1) {
        store.updateStep(sid, evalStepId, { status: 'done', detail: 'Max iterations reached, writing report' });
        break;
      }

      const evalResult = await aiComplete(
        streamFn,
        'You are a research evaluator. Given the research topic and facts gathered, decide if more research is needed. If the facts are comprehensive and cover the topic well, respond with exactly "DONE". If more research is needed, suggest 2-3 new specific search queries, one per line.',
        `Research topic: "${session.query}"\n\nFacts gathered (${currentFacts.length}):\n${currentFacts.map((f) => `- ${f}`).join('\n')}\n\nSources consulted (${updatedSources.length}):\n${updatedSources.map((s) => `- ${s.title}`).join('\n')}`,
        signal,
      );

      if (evalResult.toUpperCase().includes('DONE') || currentFacts.length >= 20) {
        store.updateStep(sid, evalStepId, { status: 'done', detail: 'Sufficient information gathered' });
        break;
      }

      currentQuery = evalResult.split('\n').map((q) => q.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean).join(' ');
      store.updateStep(sid, evalStepId, { status: 'done', detail: 'More research needed, continuing...' });

      iteration++;
    }

    // --- REPORT ---
    const reportStepId = stepId();
    store.addStep(sid, { id: reportStepId, type: 'report', status: 'running', detail: 'Writing final report...' });
    store.updateSession(sid, { status: 'synthesizing' });

    // Final read of state
    const finalFacts = ((): string[] => {
      try {
        const storeState = (store as unknown as { getState?: () => { sessions: ResearchSession[] } });
        if (storeState.getState) {
          const s = storeState.getState().sessions.find((ss: ResearchSession) => ss.id === sid);
          if (s) return s.facts;
        }
      } catch { /* ignore */ }
      return session.facts;
    })();

    const finalSources = ((): ResearchSource[] => {
      try {
        const storeState = (store as unknown as { getState?: () => { sessions: ResearchSession[] } });
        if (storeState.getState) {
          const s = storeState.getState().sessions.find((ss: ResearchSession) => ss.id === sid);
          if (s) return s.sources;
        }
      } catch { /* ignore */ }
      return session.sources;
    })();

    const reportMessages = [
      {
        role: 'system' as const,
        content: `You are a research report writer. Write a comprehensive, well-structured research report in markdown. Use these sections:
## Overview
Brief introduction to the topic.

## Key Findings
Organized subsections with detailed findings. Use specific facts, names, numbers, dates.

## Summary
Concise takeaway.

## Sources
Numbered list with [title](url) format.

Be thorough but concise. Write in a clear, professional tone. Cite specific details from the facts gathered.`,
      },
      {
        role: 'user' as const,
        content: `Research topic: "${session.query}"

Facts gathered:
${finalFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Sources:
${finalSources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`).join('\n')}

Write the full research report now.`,
      },
    ];

    let report = '';
    const reportStream = streamFn(reportMessages);
    for await (const chunk of reportStream) {
      if (signal?.aborted) throw new Error('Research aborted');
      if (chunk.type === 'content') {
        report += chunk.text;
        store.updateSession(sid, { report });
      }
    }

    store.updateStep(sid, reportStepId, { status: 'done', detail: 'Report complete' });
    store.updateSession(sid, { status: 'done', report: report.trim(), completedAt: Date.now() });

    // Generate suggested follow-up queries
    try {
      const suggestResult = await aiComplete(
        streamFn,
        'You are a research assistant. Given a completed research topic, suggest 3-4 follow-up research queries that would deepen understanding. Output one query per line, nothing else. No numbering, no bullets.',
        `Original research: "${session.query}"\n\nThe research is complete. Suggest 3-4 follow-up queries for deeper exploration.`,
        signal,
      );
      const suggestions = suggestResult.split('\n').map((q) => q.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean).slice(0, 4);
      if (suggestions.length > 0) {
        store.updateSession(sid, { suggestedQueries: suggestions });
      }
    } catch {
      // Non-critical — ignore failure
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Research failed';
    store.updateSession(sid, { status: 'error', errorMessage: message, completedAt: Date.now() });
    throw err;
  }
}
