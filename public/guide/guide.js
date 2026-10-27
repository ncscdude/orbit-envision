const TABS = ['Command Center','Candidate Queue','Panel Workspace','HELIOS Command','Scoring Audit','Match Lab','Cross Analytics','Career Planner N-Box','Operations Registers','DELTA Ledger','Board Statistics & Roles'];

const ROLES = [
  { id: 'bmo-lead', name: 'BMO Lead', short: 'Runs the boards', color: '#00b8de',
    title: 'Board administrator and governance authority',
    question: 'Is every board cycle on schedule, complete, and under control?',
    lands: 'Command Center',
    tabs: ['Command Center','Candidate Queue','Panel Workspace','HELIOS Command','Scoring Audit','Match Lab','Cross Analytics','Operations Registers','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Read the four cards', d: 'Active Boards, Schedule On Track, Packet Completeness, and Items Needing Action. Click any card to drill into the list behind it.', img: 'bmo-1-command', cap: 'Command Center' },
      { t: 'Filter by phase', d: 'Click a phase in the 8-phase bar to filter milestones and the KPI catalog. Click it again, or Reset Filters, to clear.', img: 'bmo-1-command', cap: 'Command Center, phase bar' },
      { t: 'Check the pipeline in HELIOS Command', d: 'Stage-gate funnel, stuck and failed records, and source freshness for ARMS, MilPDS, MyVector, and SURF. Lock Population works only when Packet Completeness is 95% or higher.', img: 'bmo-2-helios', cap: 'HELIOS Command' },
      { t: 'Resolve score outliers in Scoring Audit', d: 'Heartburn cases are scores 1.5 points or more from the panel average. Choose Reconcile, Uphold, or Escalate, with a note.', img: 'bmo-3-audit', cap: 'Scoring Audit' },
      { t: 'Use the rollback only when needed', d: 'The Parity Breach Rollback Playbook is yours alone. It walks four steps and asks you to type ROLLBACK to confirm.', img: 'bmo-3-audit', cap: 'Scoring Audit, rollback' }
    ],
    can: ['Lock the population at 95% packet completeness or higher','Certify the Order of Merit','Run the rollback playbook','Edit milestones and KPI text','Export the audit package'],
    cannot: ['Open the Career Planner N-Box (talent data)','Override anything without a 20-character reason'] },

  { id: 'panelist', name: 'Panelist', short: 'Scores records', color: '#e0a000',
    title: 'Board evaluator, behind the talent firewall',
    question: 'Which record do I score next, and what does the evidence show?',
    lands: 'Candidate Queue',
    tabs: ['Command Center','Candidate Queue','Panel Workspace','Cross Analytics','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Find your record in the queue', d: 'Pick the board, then filter or search with <kbd>Ctrl</kbd>+<kbd>J</kbd>. Random Shuffle reorders the queue and logs its seed. Click a row to open it.', img: 'panel-1-queue', cap: 'Candidate Queue' },
      { t: 'Review the evidence in 8 lenses', d: 'Start with Overview: SOI, ROPs, ARMS freshness, and SURF. Switch lenses with <kbd>Alt</kbd>+<kbd>1</kbd> to <kbd>Alt</kbd>+<kbd>8</kbd>.', img: 'panel-2-workspace', cap: 'Panel Workspace' },
      { t: 'Check the Scribe summary, then sign off', d: 'The LLM Scribe panel is advisory. Compare it with the record before you sign off. Your sign-off is logged.', img: 'panel-2-workspace', cap: 'Panel Workspace, Scribe' },
      { t: 'Score at the bottom dock', d: 'Keys <kbd>1</kbd> to <kbd>5</kbd> set 6.0 to 10.0. Hold <kbd>Shift</kbd> to add 0.5. Arrows nudge by 0.5. Submit and Next saves and moves on.', img: 'panel-2-workspace', cap: 'Scoring dock' },
      { t: 'Flag when the panel should discuss', d: 'Flag for Discussion needs a short reason. The model score and panel average appear only after you submit.', img: 'panel-2-workspace', cap: 'Scoring dock, flag' }
    ],
    can: ['Score records from 6.0 to 10.0','Flag a record for discussion','Sign off a Scribe summary','Review all 8 evidence lenses'],
    cannot: ['See other panelists’ unfinalized scores','See the draft Order of Merit','See any talent or loss data','Edit milestones or registers'] },

  { id: 'board-recorder', name: 'Board Recorder', short: 'Keeps the record', color: '#14b87a',
    title: 'Board operations and audit lead',
    question: 'Are milestones, risks, and the decision record in order?',
    lands: 'Operations Registers',
    tabs: ['Command Center','Candidate Queue','Panel Workspace','HELIOS Command','Scoring Audit','Cross Analytics','Operations Registers','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Work the milestone log', d: 'Late items sit at the top. Update planned or actual dates. Each change is logged.', img: 'rec-1-registers', cap: 'Operations Registers' },
      { t: 'Keep risks and AAR items current', d: 'The Risk, Issue & Change Log shows age, owner, suspense, and escalation. Phase 8 holds AAR items with owners and due dates.', img: 'rec-1-registers', cap: 'Operations Registers, tabs' },
      { t: 'Verify the ledger', d: 'DELTA Ledger shows the chain status. Filter by type, actor, or record, replay earlier states, and export a CSV.', img: 'rec-2-ledger', cap: 'DELTA Ledger' },
      { t: 'Watch the pipeline', d: 'HELIOS Command shows stuck and failed records and stale sources, so you can chase them before lock.', img: 'bmo-2-helios', cap: 'HELIOS Command' }
    ],
    can: ['Edit milestone dates','Log and escalate risks, issues, and changes','Add AAR items','Verify and export the ledger'],
    cannot: ['Lock the population','Certify the Order of Merit','Submit scores','Open the Career Planner N-Box'] },

  { id: 'assignments', name: 'Assignments Officer', short: 'Places people', color: '#9b5cf0',
    title: 'Post-board slating authority',
    question: 'Who goes to which billet, and how solid is each match?',
    lands: 'Match Lab',
    tabs: ['Command Center','Candidate Queue','Match Lab','Career Planner N-Box','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Work in Sandbox first', d: 'Switch the toggle at top right to Sandbox Scenario. Nothing official changes until you Promote a scenario.', img: 'asg-2-sandbox', cap: 'Match Lab, Sandbox' },
      { t: 'Move the weights and read the rerank', d: 'Tab 4B. Adjust Order of Merit, SOI tags, skills, grade fit, preference, and billet priority. The panel below shows who moved and how many critical billets are filled.', img: 'asg-3-weights', cap: 'Match Lab, 4B Weight Sliders' },
      { t: 'Test stability and fit', d: 'Tab 4C compares greedy and stable matching. 4D lists fragile matches. 4E finds near-fit candidates. 4F shows thin supply and decline cascades.', img: 'asg-1-matchlab', cap: 'Match Lab, analysis tabs' },
      { t: 'Approve, override, and draft the PSDM', d: 'Approve or Override each match (overrides need a 20-character reason). Generate Draft PSDM unlocks after at least one approved match.', img: 'asg-1-matchlab', cap: 'Match Lab, Match Board' }
    ],
    can: ['Run stable matching and weight scenarios','Promote a scenario to the official proposal','Draft the PSDM and export the audit package','Turn on the talent overlay for finalized records'],
    cannot: ['Change board scores','Certify the Order of Merit'] },

  { id: 'hq-viewer', name: 'HQ Strategic Viewer', short: 'Oversees, read-only', color: '#2e86ab',
    title: 'Executive oversight, read-only',
    question: 'Is the portfolio ready, and where is it slipping?',
    lands: 'Command Center',
    tabs: ['Command Center','HELIOS Command','Cross Analytics','Operations Registers','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Scan the portfolio', d: 'The four cards and the cycle status donut show the whole portfolio. The Board Health Forecast shows which cycles may slip past release.', img: 'hq-1-command', cap: 'Command Center' },
      { t: 'Open one board', d: 'Board Statistics & Roles. Pick a board to see its funnel, scoring pace, milestones, risks, and the role matrix.', img: 'hq-2-boardstats', cap: 'Board Statistics & Roles' },
      { t: 'Check readiness and staffing', d: 'HELIOS Command shows portfolio readiness, packet completeness against the 95% lock rule, and staffing.', img: 'bmo-2-helios', cap: 'HELIOS Command' },
      { t: 'Confirm the record is intact', d: 'DELTA Ledger shows whether the hash chain verifies.', img: 'rec-2-ledger', cap: 'DELTA Ledger' }
    ],
    can: ['View every portfolio, readiness, and schedule screen','Verify the ledger'],
    cannot: ['Score, edit dates, or change any record','See candidate scoring screens or talent data'] },

  { id: 'career-planner', name: 'CFM / Career Planner', short: 'Plans talent', color: '#e0458f',
    title: 'Career field manager and talent lead',
    question: 'Who is key talent, who might leave, and what would it cost?',
    lands: 'Career Planner N-Box',
    tabs: ['Command Center','Match Lab','Career Planner N-Box','DELTA Ledger','Board Statistics & Roles'],
    steps: [
      { t: 'Pick a view', d: 'Three tabs: the 3x3 N-Box Grid, the Roster Card Gallery, and the Loss Modeler.', img: 'cfm-1-planner', cap: 'Career Planner N-Box' },
      { t: 'Slice the pool', d: 'Filter by DAFSC, grade, look, readiness, flight risk (M-601), and impact tier (M-602).', img: 'cfm-1-planner', cap: 'Career Planner, slices' },
      { t: 'Model a loss', d: 'In the Key Talent Roster, Impact Loss Calc estimates what a departure would cost. Dossier opens the full record and lets you log a talent note.', img: 'cfm-1-planner', cap: 'Career Planner, Key Talent Roster' },
      { t: 'Treat the numbers as estimates', d: 'Risk and talent values are rule-based and advisory. They show only for boards that are finalized and never feed scoring.', img: 'cfm-1-planner', cap: 'Career Planner, advisory badge' }
    ],
    can: ['Use the N-Box, roster, and loss modeler','Log talent notes','View Match Lab for placement context'],
    cannot: ['See live board scoring or the candidate queue','See talent data for boards not yet finalized'] }
];

const $ = s => document.querySelector(s);
const picker = $('#picker'), panel = $('#panel');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let current = ROLES[0], activeStep = 0;

picker.innerHTML = ROLES.map(r => `
  <button class="role-btn" role="tab" id="tab-${r.id}" aria-controls="panel" aria-selected="false" style="--rc:${r.color}" data-role="${r.id}">
    <span class="sw"></span><span class="n">${esc(r.name)}</span><span class="s">${esc(r.short)}</span>
  </button>`).join('');

function renderPanel() {
  const r = current;
  panel.style.setProperty('--role', r.color);
  panel.setAttribute('aria-labelledby', `tab-${r.id}`);
  const s = r.steps[activeStep];
  panel.innerHTML = `
    <div class="panel-head">
      <div class="row"><h2>${esc(r.name)}</h2><span class="title">${esc(r.title)}</span></div>
      <p class="question">${esc(r.question)}</p>
      <div class="meta">
        <span class="chip on">Lands on <strong>${esc(r.lands)}</strong></span>
        <span class="chip">${r.tabs.length} of ${TABS.length} tabs</span>
      </div>
    </div>
    <div class="body">
      <div class="steps">
        <h3>Walkthrough</h3>
        ${r.steps.map((st, i) => `
          <button class="step" type="button" data-step="${i}" aria-current="${i === activeStep}">
            <span class="num">${i + 1}</span>
            <span><span class="t">${esc(st.t)}</span><span class="d">${st.d}</span><span class="cam">Screen: ${esc(st.cap)}</span></span>
          </button>`).join('')}
      </div>
      <div class="screen">
        <button class="shot" type="button" id="shot" aria-label="Enlarge screen: ${esc(s.cap)}">
          <img src="img/${s.img}.jpg" alt="ORBIT ${esc(s.cap)} as seen by ${esc(r.name)}" width="1440" height="900">
          <span class="zoom">Click to enlarge</span>
        </button>
        <p class="caption">Step ${activeStep + 1}: <span class="mono">${esc(s.cap)}</span>, signed in as ${esc(r.name)}.</p>
      </div>
    </div>
    ${r.note ? `<p class="note">${esc(r.note)}</p>` : ''}
    <div class="limits">
      <div><h3>You can</h3><ul>${r.can.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div><h3>You cannot</h3><ul>${r.cannot.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>`;
  panel.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => { activeStep = +b.dataset.step; renderPanel(); }));
  $('#shot').addEventListener('click', () => openLightbox(`img/${s.img}.jpg`, `${r.name} · ${s.cap}`));
}

function select(id, fromHash) {
  current = ROLES.find(r => r.id === id) || ROLES[0];
  activeStep = 0;
  picker.querySelectorAll('.role-btn').forEach(b => b.setAttribute('aria-selected', String(b.dataset.role === current.id)));
  renderPanel();
  if (!fromHash && location.hash !== '#' + current.id) { try { history.replaceState(null, '', '#' + current.id); } catch (e) { location.hash = current.id; } }
}
picker.addEventListener('click', e => { const b = e.target.closest('.role-btn'); if (b) select(b.dataset.role); });
picker.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  const i = ROLES.indexOf(current), n = (i + (e.key === 'ArrowRight' ? 1 : ROLES.length - 1)) % ROLES.length;
  select(ROLES[n].id); document.getElementById(`tab-${ROLES[n].id}`).focus();
});
window.addEventListener('hashchange', () => select(location.hash.slice(1), true));

// Tabs matrix
$('#matrix').innerHTML = `<thead><tr><th>Tab</th>${ROLES.map(r => `<th><span class="dot" style="background:${r.color}"></span>${esc(r.name)}</th>`).join('')}</tr></thead>
<tbody>${TABS.map(t => `<tr><td>${esc(t)}</td>${ROLES.map(r => r.tabs.includes(t)
  ? `<td class="y">Yes${r.lands === t ? '<span class="land">Lands</span>' : ''}</td>` : `<td class="n">No</td>`).join('')}</tr>`).join('')}</tbody>`;

// Lightbox
const lb = $('#lightbox');
function openLightbox(src, cap) { $('#lb-img').src = src; $('#lb-img').alt = cap; $('#lb-cap').textContent = cap; try { lb.showModal(); } catch (e) { lb.setAttribute('open', ''); } }
$('#lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

select(location.hash.slice(1), true);
