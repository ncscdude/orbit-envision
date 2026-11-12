/**
 * Project ORBIT - Method sources
 * Where each failure-testing method on the Failure Tests screen came from.
 * Edit this list to correct a source; the screen reads it as written.
 */

export interface MethodSource {
  method: string;
  usedFor: string;
  source: string;
}

export const METHOD_SOURCES: MethodSource[] = [
  {
    method: 'PASS / WARN / FAIL file gate with standard naming',
    usedFor: 'Incoming and late files',
    source: 'AI 101 Technical capstone (File Canonicalizer)'
  },
  {
    method: 'Written intent, acceptance criteria, and three gated checks before review',
    usedFor: 'Every code change',
    source: 'PM Capstone delivery method'
  },
  {
    method: 'A person signs off on AI output and makes every decision',
    usedFor: 'AI summaries, scores, Order of Merit',
    source: 'AI 101'
  }
];
