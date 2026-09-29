
(function () {
'use strict';
var _a8 = 'f3d71150', D, _a9 = [];
function _a6(s, h) { for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function _a1(b64) {
var bin = atob(b64), n = bin.length, out = new Uint8Array(n), x = 0xA3BC126B >>> 0, i;
for (i = 0; i < n; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[i] = bin.charCodeAt(i) ^ (x & 255); }
if (window.TextDecoder) return new TextDecoder('utf-8').decode(out);
var s = ''; for (i = 0; i < n; i++) s += String.fromCharCode(out[i]);
return decodeURIComponent(escape(s));
}
function _a7() {
document.body.innerHTML = '<div style="font-family:system-ui,sans-serif;max-width:30rem;margin:15vh auto 0;padding:1.5rem;text-align:center;line-height:1.7;color:#1D2433">' +
'<div style="font-size:2.4rem">🔒</div><p style="font-size:1.15rem;font-weight:700;margin:.4rem 0">TET Practice</p>' +
'<p>This copy has been changed, so it cannot open.<br>Please get the original file again.</p>' +
'<p>ఈ ఫైల్ మార్చబడింది, అందుకే తెరుచుకోదు.<br>దయచేసి అసలు ఫైల్‌ను మళ్ళీ పొందండి.</p></div>';
}
try {
var raw = _a1(document.getElementById('tet-data').textContent.replace(/\s+/g, ''));
var me = document.getElementById('tet-app').text.replace("'" + _a8 + "'", "'__SIG__'");
var css = document.getElementById('tet-css').textContent;
if (_a6(css + me + raw, 2166136261).toString(16) !== _a8) throw new Error('changed');
D = JSON.parse(raw);
_a9 = JSON.parse(document.getElementById('tet-pics').textContent || '[]');
} catch (e) { _a7(); return; }
var S = {};
D.subjects.forEach(function (s) { S[s.id] = s; });
var PAPERS = D.papers && D.papers.length ? D.papers : [{ id: '2A', name: 'Paper 2A', te: 'పేపర్ 2A', color: '#5B47D6' }];
function paperOf(id) { for (var i = 0; i < PAPERS.length; i++) if (PAPERS[i].id === id) return PAPERS[i]; return PAPERS[PAPERS.length - 1]; }
function paperOfS(s) { return paperOf(s.paper || '2A'); }
function curPaper() { return paperOf(st.paper).id; }
function subjectsOf(p) { return D.subjects.filter(function (s) { return paperOfS(s).id === p; }); }
function pbadge(s) { var p = paperOfS(s); return PAPERS.length > 1 ? '<span class="pb" style="--pc:' + p.color + '">' + p.id + '</span>' : ''; }
function txt(o) { return o ? (st.set.ui === 'te' && o.te ? o.te : o.en) : ''; }
function _b4(s, n) { return +s.key.charAt(n - 1); }
var CHUNK = 20, FIRST = 8;
var KEY = 'tet2a-practice-v1', BAK = KEY + '-bak', SKEY = 'tet-usage-v1', st, held = null, lastBak = 0;
function obj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
function sub(id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(S, id) ? S[id] : null; }
function load(raw) {
st = { ans: {}, last: {}, lastSid: '', set: { size: 1, q: 'both', ui: 'en', dark: false }, welcomed: false, test: null };
try { var o = raw ? JSON.parse(raw) : null; if (obj(o)) Object.keys(o).forEach(function (k) { st[k] = o[k]; }); } catch (e) {}
if (!obj(st.set)) st.set = { size: 1, q: 'both', ui: 'en', dark: false };
if (!st.set.q) st.set.q = 'both';
if (!st.set.ui) st.set.ui = 'en';
['ans', 'last', 'days', 'lastBy'].forEach(function (k) { if (!obj(st[k])) st[k] = {}; });
var t = st.test; held = null;
if (t && !(obj(t) && Array.isArray(t.list) && obj(t.picks))) st.test = t = null;
if (t && !sub(t.sid)) { held = t; st.test = null; }
else if (t && t.list.some(function (n) { return !(n >= 1 && n <= S[t.sid].count); })) st.test = null;
if (!st.paper) st.paper = st.welcomed ? '2A' : '';
Object.keys(st.lastBy).forEach(function (p) { var x = sub(st.lastBy[p]); if (x && paperOfS(x).id !== p) delete st.lastBy[p]; });
var ls = sub(st.lastSid); if (ls && !sub(st.lastBy[paperOfS(ls).id])) st.lastBy[paperOfS(ls).id] = ls.id;
}
function parses(r) { try { return obj(JSON.parse(r)); } catch (e) { return false; } }
var lastRaw = null;
try { lastRaw = window.localStorage.getItem(KEY); } catch (e) {}
if (lastRaw !== null && !parses(lastRaw)) {
try { if (window.localStorage.getItem(KEY + '-damaged') === null) window.localStorage.setItem(KEY + '-damaged', lastRaw); } catch (e) {}
}
if (lastRaw === null || !parses(lastRaw)) {
var bak = null;
try { bak = window.localStorage.getItem(BAK); } catch (e) {}
if (bak !== null && parses(bak)) { load(bak); lastRaw = null; save(); } else load(lastRaw);
} else load(lastRaw);
var run = 0;
function save() {
var o = st;
if (held && !st.test) { o = {}; Object.keys(st).forEach(function (k) { o[k] = st[k]; }); o.test = held; }
try {
var j = JSON.stringify(o), ls = window.localStorage;
try { ls.setItem(KEY, j); }
catch (e) {
try { ls.removeItem(SKEY); ls.setItem(KEY, j); }
catch (x) { if (lastRaw === null) throw x; ls.removeItem(BAK); ls.setItem(KEY, j); }
}
lastRaw = j;
if (Date.now() - lastBak > 60000) { lastBak = Date.now(); try { ls.setItem(BAK, j); } catch (e) {} }
} catch (e) {}
}
var TX = {
en: {
app: 'TET 2A Practice', appSub: 'Teacher Eligibility Test · Paper 2A', welcome: 'Practise all Paper 2A subjects with the answer key.',
howTo: 'How to use', start: 'Start',
steps: ['Choose a subject.', 'Tap the answer you think is right.', 'Green means correct, red means wrong. Scroll down for the next question.', 'Your answers stay saved on this phone. Tap Continue next time.'],
settings: 'Settings', back: 'Back', progress: 'answered', correctPct: 'correct',
cont: 'Continue', question: 'Question', questions: 'questions', subjects: 'Subjects', q: 'Q',
done: 'done', correct: 'correct', wrong: 'wrong', startPractice: 'Start practice', contPractice: 'Continue practice',
goTo: 'Go to a question', goToSub: 'Pick any question number', mistakes: 'Review my mistakes',
mistakesSub: 'answered wrongly', noMistakes: 'No mistakes so far', test: 'Practice test', testSub: 'Random questions, score at the end',
contTest: 'Continue your test', lastTest: 'Last test', seeAnswers: 'See the answers', clearSubject: 'Clear answers for this subject',
finished: 'Done', rightMsg: 'Correct!', wrongMsg: 'Wrong.', rightIs: 'Correct answer is', skipped: 'Not answered.',
tryAgain: 'Try again', tapNum: 'Choose the option number shown in the question', enlarge: 'Tap to enlarge',
myMistakes: 'My mistakes', testT: 'Practice test', result: 'Test result', excellent: 'Excellent!', good: 'Good work — keep practising',
keep: 'Keep practising', time: 'Time', notAnswered: 'skipped', answers: 'Answers', newTest: 'New test', home: 'Home',
howMany: 'How many questions?', howManySub: 'Questions are picked at random. Answers and your score are shown when you submit.',
size: 'Text size', normal: 'Normal', large: 'Large', xlarge: 'Larger', menuLang: 'Menu language', qLang: 'Show questions in',
both: 'Both', screen: 'Screen', light: 'Light', dark: 'Dark', clearAll: 'Clear all my answers', close: 'Close',
legendOk: 'Correct', legendBad: 'Wrong', legendNot: 'Not answered', pickTitle: 'Go to a question',
loading: 'Loading questions…', offline: 'Could not load the questions. Please check your internet connection.',
more: 'Show more questions', earlier: 'Show earlier questions', endList: 'That was the last question.',
endMistakes: 'That was the last one. Well done!', submit: 'Submit test', testInfo: 'Answers are shown when you submit.',
morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', hello: 'Hello',
mottos: ['Small steps every day make a big difference.', 'Every question you practise brings you closer.', 'Learning is a journey — enjoy each step.',
'Regular practice is the secret of success.', 'You are doing well. One more question!', 'A calm mind learns best. Take it one question at a time.'],
today: 'today', streak1: 'day in a row', streakN: 'days in a row', startHint: 'Pick a subject below to begin.',
praise: ['Correct!', 'Well done!', 'Great!', 'Excellent!', 'Right answer!'], notQuite: 'Not quite — the answer is',
inRow: '{n} correct in a row! 🎉', overall: 'All subjects',
subjectsWord: 'subjects', courtesy: 'Courtesy', confirmReplaceTest: 'You have an unfinished test in {s}. Start a new test instead?',
confirmFinish: '{n} question(s) not answered. Submit the test?', confirmClearAll: 'Clear all your answers in {p}?', otherPaper: 'the other paper', updated: 'This app has been updated. Please tap to reload.', reloadNow: 'Reload', picNet: 'Picture not downloaded yet. Connect to the internet once.',
confirmClearSub: 'Clear your answers in {s}?'
},
te: {
app: 'TET 2A సాధన', appSub: 'ఉపాధ్యాయ అర్హత పరీక్ష · పేపర్ 2A', welcome: 'పేపర్ 2A అన్ని సబ్జెక్టులను జవాబులతో సాధన చేయండి.',
howTo: 'ఎలా వాడాలి', start: 'ప్రారంభించండి',
steps: ['సబ్జెక్టును ఎంచుకోండి.', 'సరైనదని మీరు అనుకున్న జవాబుపై నొక్కండి.', 'ఆకుపచ్చ అంటే సరైనది, ఎరుపు అంటే తప్పు. తరువాతి ప్రశ్న కోసం కిందికి జరపండి.', 'మీ జవాబులు ఈ ఫోన్‌లో భద్రంగా ఉంటాయి. మళ్ళీ వచ్చినప్పుడు "కొనసాగించండి" నొక్కండి.'],
settings: 'సెట్టింగ్‌లు', back: 'వెనుకకు', progress: 'జవాబిచ్చారు', correctPct: 'సరైనవి',
cont: 'కొనసాగించండి', question: 'ప్రశ్న', questions: 'ప్రశ్నలు', subjects: 'సబ్జెక్టులు', q: 'ప్రశ్న ',
done: 'పూర్తి', correct: 'సరైనవి', wrong: 'తప్పులు', startPractice: 'సాధన ప్రారంభించండి', contPractice: 'సాధన కొనసాగించండి',
goTo: 'ప్రశ్నకు వెళ్ళండి', goToSub: 'ఏ ప్రశ్న సంఖ్యనైనా ఎంచుకోండి', mistakes: 'నా తప్పులు మళ్ళీ చేయండి',
mistakesSub: 'తప్పు జవాబులు', noMistakes: 'ఇప్పటివరకు తప్పులు లేవు', test: 'మాదిరి పరీక్ష', testSub: 'యాదృచ్ఛిక ప్రశ్నలు, చివర్లో మార్కులు',
contTest: 'పరీక్ష కొనసాగించండి', lastTest: 'గత పరీక్ష', seeAnswers: 'జవాబులు చూడండి', clearSubject: 'ఈ సబ్జెక్టు జవాబులు తొలగించండి',
finished: 'పూర్తయింది', rightMsg: 'సరైన జవాబు!', wrongMsg: 'తప్పు.', rightIs: 'సరైన జవాబు', skipped: 'జవాబు ఇవ్వలేదు.',
tryAgain: 'మళ్ళీ', tapNum: 'ప్రశ్నలోని సరైన ఎంపిక సంఖ్యను ఎంచుకోండి', enlarge: 'పెద్దదిగా చూడండి',
myMistakes: 'నా తప్పులు', testT: 'మాదిరి పరీక్ష', result: 'పరీక్ష ఫలితం', excellent: 'అద్భుతం!', good: 'బాగుంది — సాధన కొనసాగించండి',
keep: 'సాధన కొనసాగించండి', time: 'సమయం', notAnswered: 'వదిలినవి', answers: 'జవాబులు', newTest: 'కొత్త పరీక్ష', home: 'మొదటి పేజీ',
howMany: 'ఎన్ని ప్రశ్నలు?', howManySub: 'ప్రశ్నలు యాదృచ్ఛికంగా వస్తాయి. సమర్పించిన తరువాత జవాబులు, మార్కులు చూపిస్తాము.',
size: 'అక్షరాల పరిమాణం', normal: 'సాధారణ', large: 'పెద్ద', xlarge: 'ఇంకా పెద్ద', menuLang: 'మెనూ భాష', qLang: 'ప్రశ్నలు ఏ భాషలో',
both: 'రెండూ', screen: 'స్క్రీన్', light: 'లేత', dark: 'ముదురు', clearAll: 'నా జవాబులన్నీ తొలగించండి', close: 'మూసివేయి',
legendOk: 'సరైనవి', legendBad: 'తప్పులు', legendNot: 'చేయనివి', pickTitle: 'ప్రశ్నకు వెళ్ళండి',
loading: 'ప్రశ్నలు వస్తున్నాయి…', offline: 'ప్రశ్నలు రాలేదు. దయచేసి ఇంటర్నెట్ కనెక్షన్ చూడండి.',
more: 'మరిన్ని ప్రశ్నలు చూపించు', earlier: 'ముందరి ప్రశ్నలు చూపించు', endList: 'ఇదే చివరి ప్రశ్న.',
endMistakes: 'ఇదే చివరిది. బాగా చేశారు!', submit: 'పరీక్ష సమర్పించండి', testInfo: 'సమర్పించిన తరువాత జవాబులు చూపిస్తాము.',
morning: 'శుభోదయం', afternoon: 'శుభ మధ్యాహ్నం', evening: 'శుభ సాయంత్రం', hello: 'నమస్కారం',
mottos: ['రోజూ కొంచెం సాధనే గొప్ప విజయానికి దారి.', 'ప్రతి ప్రశ్న మిమ్మల్ని లక్ష్యానికి దగ్గర చేస్తుంది.', 'నేర్చుకోవడం ఒక ప్రయాణం — ప్రతి అడుగు ఆనందించండి.',
'నిరంతర సాధనే విజయ రహస్యం.', 'మీరు బాగా చేస్తున్నారు. ఇంకొక ప్రశ్న!', 'ప్రశాంతమైన మనసు బాగా నేర్చుకుంటుంది. ఒక్కొక్క ప్రశ్న చేయండి.'],
today: 'ఈరోజు', streak1: 'రోజు వరుసగా', streakN: 'రోజులు వరుసగా', startHint: 'మొదలుపెట్టడానికి కింద ఒక సబ్జెక్టు ఎంచుకోండి.',
praise: ['సరైనది!', 'బాగుంది!', 'చక్కగా చేశారు!', 'అద్భుతం!', 'సరైన జవాబు!'], notQuite: 'కొద్దిగా తప్పింది — సరైన జవాబు',
inRow: 'వరుసగా {n} సరైనవి! 🎉', overall: 'అన్ని సబ్జెక్టులు',
subjectsWord: 'సబ్జెక్టులు', courtesy: 'సౌజన్యం', confirmReplaceTest: '{s} లో పూర్తికాని పరీక్ష ఉంది. దాని బదులు కొత్త పరీక్ష మొదలుపెట్టాలా?',
confirmFinish: '{n} ప్రశ్నలకు జవాబు ఇవ్వలేదు. పరీక్ష సమర్పించాలా?', confirmClearAll: '{p} లో మీ జవాబులన్నీ తొలగించాలా?', otherPaper: 'మరో పేపర్', updated: 'యాప్ అప్‌డేట్ అయింది. దయచేసి మళ్ళీ తెరవండి.', reloadNow: 'మళ్ళీ తెరవండి', picNet: 'చిత్రం ఇంకా రాలేదు. ఒకసారి ఇంటర్నెట్ కనెక్ట్ చేయండి.',
confirmClearSub: '{s} జవాబులు తొలగించాలా?'
}
};
function T(k) { var d = TX[st.set.ui] || TX.en; return d[k] !== undefined ? d[k] : TX.en[k]; }
function te() { return st.set.ui === 'te'; }
function sname(s) { return te() ? s.te : s.name; }
function sname2(s) { return te() ? s.name : s.te; }
function frac(a, b) { return a + ' / ' + b; }
function ic(p, fill) {
return '<svg class="i" viewBox="0 0 24 24" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
}
var I = {
back: ic('<path d="M15 18l-6-6 6-6"/>'), next: ic('<path d="M9 18l6-6-6-6"/>'),
up: ic('<path d="M18 15l-6-6-6 6"/>'), down: ic('<path d="M6 9l6 6 6-6"/>'),
gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
grid: ic('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
play: ic('<path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z"/>', true),
redo: ic('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
check: ic('<path d="M20 6L9 17l-5-5"/>'), checkC: ic('<circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>'),
cross: ic('<path d="M18 6L6 18M6 6l12 12"/>'), crossC: ic('<circle cx="12" cy="12" r="9.5"/><path d="M15 9l-6 6M9 9l6 6"/>'),
minusC: ic('<circle cx="12" cy="12" r="9.5"/><path d="M8 12h8"/>'),
zoom: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8v6M8 11h6"/>'),
close: ic('<path d="M18 6L6 18M6 6l12 12"/>'), flag: ic('<path d="M4 22V4"/><path d="M4 4h12l-2.5 4.5L16 13H4"/>'),
book: ic('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5v-2z"/><path d="M8 7h7M8 11h5"/>'),
help: ic('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.5-2.8 4"/><path d="M12 17.3h.01"/>'),
home: ic('<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
sun: ic('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
moon: ic('<path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7z"/>'),
spark: ic('<path d="M12 2.8l2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2z"/>', true)
};
var GLYPH = {
cdp: ic('<circle cx="9" cy="7" r="3"/><path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h0a5.5 5.5 0 0 1 5.5 5.5V20"/><circle cx="17.5" cy="9.5" r="2.2"/><path d="M16 20v-1.3a4 4 0 0 1 5.5-3.7"/>'),
ph: ic('<circle cx="12" cy="12" r="1.3" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)"/>'),
bi: ic('<path d="M6 19c-1.5-7 3-13.5 14-14-.2 10-6 15-13 14.5"/><path d="M6 19c2-4.5 5-7.5 9.5-9.5"/>'),
so: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>'),
ev: ic('<path d="M12 21v-8"/><path d="M12 13C7.8 13 5.5 10.4 5.5 6.8 9.6 6.8 12 9.4 12 13z"/><path d="M12 11c0-3.9 2.6-6.5 6.5-6.5 0 3.9-2.6 6.5-6.5 6.5z"/><path d="M8 21h8"/>')
};
function glyph(s) { return GLYPH[s.icon] || s.icon; }
function tile(s) { return '<span class="tile" style="' + sv(s) + '">' + glyph(s) + '</span>'; }
function chev(txt) { return '<span class="end">' + (txt || '') + I.next + '</span>'; }
function rgbOf(h) { h = String(h).replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function lum(c) {
var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function readable(c, to, bgL) {
for (var t = 0; t <= 1; t += 0.04) {
var x = c.map(function (v, i) { return Math.round(v + (to[i] - v) * t); }), L = lum(x);
if ((Math.max(L, bgL) + 0.05) / (Math.min(L, bgL) + 0.05) >= 4.6) return 'rgb(' + x.join(',') + ')';
}
return 'rgb(' + to.join(',') + ')';
}
var SV = {};
function sv(s) {
if (SV[s.id]) return SV[s.id];
var c = rgbOf(s.color);
return (SV[s.id] = '--rgb:' + c.join(',') + ';--sd:' + readable(c, [30, 18, 52], 0.74) + ';--sb:' + readable(c, [30, 18, 52], 1) + ';--sl:' + readable(c, [255, 255, 255], 0.045));
}
function arc(fr, stroke, track, w, fill, defs) {
var r = 60 - w / 2 - 1, C = 2 * Math.PI * r;
return '<svg viewBox="0 0 120 120" aria-hidden="true">' + (defs || '') + (fill ? '<circle cx="60" cy="60" r="' + (r - w / 2 + 0.5) + '" style="fill:' + fill + '"/>' : '') +
'<circle cx="60" cy="60" r="' + r + '" fill="none" style="stroke:' + track + '" stroke-width="' + w + '"/>' +
(fr > 0 ? '<circle cx="60" cy="60" r="' + r + '" fill="none" style="stroke:' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' +
Math.max(0.5, C * Math.min(1, fr)).toFixed(1) + ' ' + C.toFixed(1) + '"/>' : '') + '</svg>';
}
var GRAD = '<defs><linearGradient id="ringgrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" style="stop-color:var(--g1)"/><stop offset="1" style="stop-color:var(--g2)"/></linearGradient></defs>';
function dayIcon() { var h = new Date().getHours(); return h >= 5 && h < 18 ? I.sun : I.moon; }
function confetti(k) {
try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
var box = document.createElement('div'), cols = ['#A78BFA', '#F9A8D4', '#FCD34D', '#6EE7B7', '#93C5FD', '#FDBA74', '#C4B5FD'], h = '';
box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
for (var i = 0; i < (k || 30); i++) {
h += '<i style="left:' + (4 + Math.random() * 92).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.4).toFixed(2) +
's;animation-duration:' + (1.4 + Math.random() * 1).toFixed(2) + 's;--dx:' + ((Math.random() - 0.5) * 140).toFixed(0) + 'px;--rt:' + (Math.random() * 900 - 450).toFixed(0) + 'deg"></i>';
}
box.innerHTML = h; document.body.appendChild(box);
setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3000);
}
function stats(sid) {
var s = S[sid], a = st.ans[sid] || {}, done = 0, ok = 0;
Object.keys(a).forEach(function (n) { n = +n; if (!(n >= 1 && n <= s.count) || !a[n]) return; done++; if (_b4(s, n) === a[n]) ok++; });
return { done: done, ok: ok, bad: done - ok, total: s.count };
}
function mistakes(sid) {
var s = S[sid], a = st.ans[sid] || {}, out = [];
for (var n = 1; n <= s.count; n++) if (a[n] && a[n] !== _b4(s, n)) out.push(n);
return out;
}
function nextPractice(sid) {
var s = S[sid], a = st.ans[sid] || {}, n = st.last[sid], i;
if (!(n >= 1 && n <= s.count)) {
for (i = 1; i <= s.count; i++) if (!a[i]) return i;
return 1;
}
if (!a[n]) return n;
for (i = n + 1; i <= s.count; i++) if (!a[i]) return i;
for (i = 1; i < n; i++) if (!a[i]) return i;
return n;
}
function dayKey(d) { d = d || new Date(); var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
function todayCount() { return (st.days && st.days[dayKey()]) || 0; }
function streak() {
var d = new Date(), n = 0;
if (!todayCount()) d.setDate(d.getDate() - 1);
while (st.days && st.days[dayKey(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
return n;
}
function logAnswer() {
if (!st.days || typeof st.days !== 'object') st.days = {};
var k = dayKey(); st.days[k] = (st.days[k] || 0) + 1;
var keys = Object.keys(st.days);
if (keys.length > 70) keys.sort().slice(0, keys.length - 70).forEach(function (x) { delete st.days[x]; });
return st.days[k];
}
function greet() { var h = new Date().getHours(); return T(h >= 4 && h < 12 ? 'morning' : h < 17 && h >= 12 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'hello'); }
function motto() { var m = T('mottos'), d = new Date(); return m[(d.getDate() + d.getMonth()) % m.length]; }
var toastTimer = null;
function toast(msg) {
var el = document.getElementById('toast');
if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
el.textContent = msg;
el.style.bottom = document.querySelector('.bottombar') ? '6.2rem' : '';
el.className = 'toast show';
clearTimeout(toastTimer);
toastTimer = setTimeout(function () { el.className = 'toast'; }, 2400);
}
function fmtN(x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function mmss(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function _b5(x) { return typeof x === 'number' ? 'data:image/png;base64,' + _a9[x] : x.indexOf('img/') === 0 ? x : 'data:image/png;base64,' + x; }
function _a2(t) {
var out = [], i, c;
for (i = 0; i < t.length; i++) {
c = t.charCodeAt(i);
if (c >= 32 && c < 128) c = 32 + (c - 32 + 96 - 53) % 96;
else if (c >= 0x0C00 && c < 0x0C80) c = 0x0C00 + (c - 0x0C00 + 128 - 76) % 128;
out.push(String.fromCharCode(c));
}
return out.join('');
}
function _a3(buf) {
var a = new Uint8Array(buf), x = 0xF6989E9D >>> 0;
for (var i = 0; i < a.length; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; a[i] ^= x & 255; }
return a;
}
var _b3 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', _b1 = {};
function _a4(p) { return typeof p === 'number' || p.indexOf('img/') !== 0 ? _b5(p) : (_b1[p] && _b1[p].url) || _b3; }
function _a5() {
var imgs = document.querySelectorAll('img[data-p]');
Array.prototype.forEach.call(imgs, function (img) {
var p = img.getAttribute('data-p'), c = _b1[p] || (_b1[p] = { url: '', wait: [] });
img.removeAttribute('data-p');
if (c.url) { img.src = c.url; return; }
c.wait.push(img);
if (c.busy) return;
c.busy = true;
fetch(p).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (buf) {
c.url = URL.createObjectURL(new Blob([_a3(buf)], { type: 'image/png' }));
c.wait.forEach(function (im) { im.src = c.url; if (isPr(im.parentNode)) im.parentNode.className = 'pr'; }); c.wait = []; picDelay = 4000;
}).catch(function () {
var w = c.wait; c.wait = []; c.busy = false;
w.forEach(function (im) {
if (!document.documentElement.contains(im)) return;
im.setAttribute('data-p', p);
if (isPr(im.parentNode)) { im.parentNode.className = 'pr off'; im.parentNode.setAttribute('data-w', T('picNet')); }
});
clearTimeout(picTimer);
if (navigator.onLine !== false) { picTimer = setTimeout(_a5, picDelay); picDelay = Math.min(60000, picDelay * 2); }
});
});
}
var picTimer = 0, picDelay = 4000, warmQ = [], warmSeen = {}, warming = false, warmTimer = 0, SWK = 'serviceWorker' in navigator;
function isPr(el) { return !!el && /^pr( off)?$/.test(el.className); }
window.addEventListener('online', function () { _a5(); if (!warming) warmNext(); if (st.welcomed) warmPaper(curPaper()); });
function _b2(list) {
if (!SWK) return;
list.forEach(function (u) { if (!warmSeen[u]) { warmSeen[u] = 1; warmQ.push(u); } });
if (!warming) warmNext();
}
function warmNext() {
clearTimeout(warmTimer);
if (!warmQ.length || navigator.onLine === false || !navigator.serviceWorker.controller) { warming = false; return; }
warming = true;
var u = warmQ.shift();
fetch(u).then(warmNext, function () { warmQ.unshift(u); warming = false; warmTimer = setTimeout(warmNext, 30000); });
}
function warmPaper(p) {
if (!SWK || (navigator.connection && navigator.connection.saveData)) return;
subjectsOf(p).forEach(function (s) { if (s.file) _b6(s.id, null, true); });
}
var loads = {};
function _b6(sid, cb, quiet) {
var s = S[sid];
if (s.qs) { if (cb) cb(); return; }
var L = loads[sid] || (loads[sid] = { cbs: [], busy: false, failed: false });
if (cb) L.cbs.push(cb);
if (!quiet) L.loud = true;
if (L.busy) return;
L.busy = true; L.failed = false;
fetch(s.file).then(function (r) { if (!r.ok) { L.gone = r.status === 404; throw new Error(r.status); } return r.text(); }).then(function (txt) {
if (s.fh && _a6(txt, 2166136261).toString(16) !== s.fh) throw new Error('changed');
var qs = JSON.parse(_a2(txt));
s.qs = qs; L.busy = false;
setTimeout(function () {
var ps = []; qs.forEach(function (q) { if (q[4]) q[4].forEach(function (im) { if (typeof im[0] === 'string') ps.push(im[0]); }); });
_b2(ps);
}, 1500);
var cbs = L.cbs; L.cbs = [];
cbs.forEach(function (f) { f(); });
var b = base(); if ((b.v === 'list' || b.v === 'result') && b.sid === sid) refresh();
}).catch(function () {
var b = base(), shown = (b.v === 'list' || b.v === 'result') && b.sid === sid;
L.busy = false; L.failed = !!L.loud || shown; L.loud = false; L.cbs = [];
if (shown) refresh();
});
}
var HK = String(Date.now());
var stack = [{ v: st.welcomed ? 'home' : 'welcome' }], afterPop = null, HIST = true, lastBase = null, dirty = true, timerId = null, io = null;
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; history.replaceState({ d: 1, k: HK }, ''); } catch (e) { HIST = false; }
function go(s, quiet) {
stack.push(s);
if (HIST) { try { history.pushState({ d: stack.length, k: HK }, ''); } catch (e) { HIST = false; } }
if (!quiet) render(true);
}
function back(fn) {
if (stack.length <= 1) return;
if (HIST) { afterPop = fn || null; history.back(); }
else { stack.pop(); if (fn) fn(); else render(false); }
}
function goHome() {
if (stack.length <= 1) return;
if (HIST) { afterPop = null; history.go(-(stack.length - 1)); }
else { stack.length = 1; render(true); }
}
window.addEventListener('popstate', function (e) {
if (!e.state || e.state.k !== HK) {
afterPop = null;
if (stack.length > 1) { stack.length = 1; try { history.replaceState({ d: 1, k: HK }, ''); } catch (x) {} render(true); }
else history.back();
return;
}
var d = e.state.d || 1;
while (stack.length > d) stack.pop();
var f = afterPop; afterPop = null;
if (f) f(); else render(false);
});
function base() { for (var i = stack.length - 1; i >= 0; i--) if (!stack[i].ov) return stack[i]; return stack[0]; }
function top() { return stack[stack.length - 1]; }
var app = document.getElementById('app'), ov = document.getElementById('ov');
function render(toTop) {
var b = base(), t = top();
if (b !== lastBase || dirty) {
var y = window.pageYOffset, moved = b !== lastBase;
if (moved && lastBase && lastBase.v === 'list') lastBase.y = y;
lastBase = b; dirty = false;
app.innerHTML = view(b);
window.scrollTo(0, moved ? (b.y && !toTop ? b.y : 0) : (toTop ? 0 : y));
afterRender(b);
}
if (t.ov) {
var was = ov.className.indexOf('show') >= 0;
ov.innerHTML = overlay(t); ov.className = 'ov show' + (was ? '' : ' fresh'); document.body.className = 'lock'; showChip(); _a5();
if (!was) setTimeout(function () { ov.className = ov.className.replace(' fresh', ''); }, 450);
}
else if (ov.className !== 'ov') { ov.className = 'ov'; ov.innerHTML = ''; document.body.className = ''; }
}
function refresh() { dirty = true; render(false); }
function keepPlace(change) {
var bar = document.querySelector('.appbar'), top = bar ? bar.offsetHeight : 0, cards = document.querySelectorAll('.qcard'), anchor = null, off = 0;
for (var i = 0; i < cards.length; i++) { var r = cards[i].getBoundingClientRect(); if (r.bottom > top + 4) { anchor = cards[i]; off = r.top; break; } }
change();
if (!anchor) return;
var fix = function () { window.scrollTo(0, Math.max(0, anchor.getBoundingClientRect().top + window.pageYOffset - off)); };
fix(); setTimeout(fix, 80);
}
function showChip() {
var row = ov.querySelector('.chips'), on = row && row.querySelector('.chip.on');
if (on) row.scrollLeft = Math.max(0, on.offsetLeft - 16);
}
function afterRender(b) {
if (timerId) { clearInterval(timerId); timerId = null; }
_a5();
if (b.v === 'subject' || ((b.v === 'list' || b.v === 'result') && !S[b.sid].qs && !(loads[b.sid] && loads[b.sid].failed))) _b6(b.sid);
if (b.v === 'list' && b.mode === 'test' && st.test) {
var el = document.getElementById('timer');
timerId = setInterval(function () {
if (!el || !document.body.contains(el)) { clearInterval(timerId); timerId = null; return; }
el.textContent = mmss((Date.now() - st.test.start) / 1000);
}, 1000);
}
if (b.v === 'list' && b.focus && document.getElementById('c-' + b.focus)) { var f = b.focus; b.focus = 0; scrollToCard(f); }
watchTail();
}
function view(b) {
if (b.v === 'welcome') return vWelcome();
if (b.v === 'subject') return vSubject(b.sid);
if (b.v === 'list') return vList(b);
if (b.v === 'result') return vResult(b);
return vHome();
}
function overlay(o) {
if (o.ov === 'settings') return oSettings();
if (o.ov === 'help') return oHelp();
if (o.ov === 'grid') return oGrid(o);
if (o.ov === 'testsize') return oTestSize(o);
if (o.ov === 'zoom') return oZoom(o);
return '';
}
function appbar(o) {
return '<header class="appbar"><div class="in">' +
(o.back ? '<button class="icon-btn" data-a="back" aria-label="' + T('back') + '">' + I.back + '</button>' : '') +
'<div class="ab-t"><div class="t1">' + (o.s ? pbadge(o.s) : '') + o.title + '</div>' + (o.sub ? '<div class="t2">' + o.sub + '</div>' : '') + '</div>' +
(o.right || '') + '</div>' + (o.after || '') + '</header>';
}
function credit() {
if (!D.credit || !D.credit.length) return '';
return '<footer class="credit" lang="en"><span class="c0"><i></i><span>Courtesy</span><i></i></span><span class="cn">' + D.credit[0] + '</span>' +
(D.credit[1] ? '<span class="cr">' + D.credit[1] + '</span>' : '') +
D.credit.slice(2).map(function (x) { return '<span class="cs">' + x + '</span>'; }).join('') + '</footer>';
}
function disclaimer() {
var n = D.note && (te() ? D.note.te : D.note.en);
if (!n) return '';
return '<div class="disc" role="note"><div class="dh"><i></i><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/></svg>' + n[0] + '</span><i></i></div><p>' + n[1] + '</p></div>';
}
function sizeBtn() { return '<button class="icon-btn" data-a="settings" aria-label="' + T('settings') + '"><span class="aa">Aa</span></button>'; }
function loadingView(sid) {
var L = loads[sid];
return '<main class="wrap"><div class="card loading">' + (L && L.failed
? (L.gone ? T('updated') + '<div style="margin-top:1rem"><button class="btn btn-secondary" data-a="reloadpage">' + I.redo + '<span class="l">' + T('reloadNow') + '</span></button></div>'
: T('offline') + '<div style="margin-top:1rem"><button class="btn btn-secondary" data-a="reload" data-s="' + sid + '">' + I.redo + '<span class="l">' + T('tryAgain') + '</span></button></div>')
: '<div class="spin"></div>' + T('loading')) + '</div></main>';
}
function vWelcome() {
return '<main class="welcome"><div class="w-hero"><div class="wrap"><div class="logo">' + I.book +
'<span class="sp sp1">' + I.spark + '</span><span class="sp sp2">' + I.spark + '</span></div>' +
'<h1>' + (txt(D.app) || T('app')) + '</h1><p class="lead">' + (txt(D.welcome) || T('welcome')) + '</p><div class="bubs" aria-hidden="true">' +
subjectsOf(curPaper()).map(function (s) { return '<span class="bub" style="' + sv(s) + '">' + glyph(s) + '</span>'; }).join('') + '</div></div></div><div class="wrap">' +
'<div class="label">Language · భాష</div><div class="langs">' +
'<button class="lang' + (st.set.ui === 'en' ? ' on' : '') + '" data-a="ui" data-v="en"><span class="lg">A</span>English</button>' +
'<button class="lang' + (st.set.ui === 'te' ? ' on' : '') + '" data-a="ui" data-v="te"><span class="lg">అ</span>తెలుగు</button></div>' +
(PAPERS.length > 1 ? '<div class="label">Paper · పేపర్</div>' + paperSwitch() : '') +
'<div class="label">' + T('howTo') + '</div><ol class="group steps">' +
T('steps').map(function (s, i) { return '<li><span class="n">' + (i + 1) + '</span><span>' + s + '</span></li>'; }).join('') +
'</ol><div style="margin-top:1.1rem"><button class="btn btn-primary" data-a="begin"><span class="l">' + T('start') + '</span>' + I.next + '</button></div></div>' + credit() + disclaimer() + '</main>';
}
function paperSwitch() {
return '<div class="papers" role="tablist">' + PAPERS.map(function (p) {
var on = p.id === curPaper();
return '<button class="pbtn' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" data-a="paper" data-v="' + p.id + '" style="--pc:' + p.color + '">' +
'<span class="pd"></span><span>' + (te() ? p.te : p.name) + '<small>' + subjectsOf(p.id).length + ' ' + T('subjectsWord') + '</small></span></button>';
}).join('') + '</div>';
}
function vHome() {
var total = 0, done = 0, ok = 0, mine = subjectsOf(curPaper());
mine.forEach(function (s) { var x = stats(s.id); total += x.total; done += x.done; ok += x.ok; });
var ls = lastOfPaper(), sk = streak(), ut = openTest();
var h = '<header class="hero"><div class="hero-in"><div class="hero-top"><div class="brand"><h1>' + (txt(D.app) || T('app')) + '</h1><p>' + (txt(D.appSub) || T('appSub')) + '</p></div>' +
'<button class="pill glass" data-a="settings">' + I.gear + T('settings') + '</button></div>' + (PAPERS.length > 1 ? paperSwitch() : '');
h += '<section class="today"><div class="tx"><div class="hi">' + dayIcon() + '<span>' + greet() + '</span></div><div class="mot">' + (done ? motto() : T('startHint')) + '</div>' +
(sk || ut ? '<div class="tags">' + (sk ? '<span class="tag fire">🔥 ' + sk + ' ' + T(sk === 1 ? 'streak1' : 'streakN') + '</span>' : '') +
(ut ? '<button class="tag tst" data-a="hometest">' + I.clock + T('contTest') + ' · ' + sname(S[ut.sid]) + ' · ' + Object.keys(ut.picks).length + '/' + ut.list.length + '</button>' : '') + '</div>' : '') +
'</div></section>';
if (ls) h += '<button class="resume" data-a="resume">' + tile(ls) + '<span class="rt"><span class="r1">' + T('cont') + '</span><span class="r2"><span class="nm">' + pname(ls) + '</span><span class="qx">&nbsp;· ' + T('q') + nextPractice(ls.id) + '</span></span></span>' +
'<span class="go">' + I.play + '</span></button>';
h += '</div></header><main class="wrap home">';
h += '<div class="label lrow"><span>' + T('subjects') + (PAPERS.length > 1 ? ' · ' + (te() ? paperOf(curPaper()).te : paperOf(curPaper()).name) : '') + '</span>' + (done ? '<span class="lx">' + fmtN(done) + ' / ' + fmtN(total) + ' ' + T('progress') + ' · <b>' + Math.round(100 * ok / done) + '% ' + T('correctPct') + '</b></span>' : '') + '</div>';
h += '<div class="subjects">';
mine.forEach(function (s) {
var x = stats(s.id), pct = pctOf(x.done, x.total);
h += '<button class="stile" data-a="subject" data-s="' + s.id + '" style="' + sv(s) + '">' +
'<span class="st-top"><span class="sring">' + arc(x.done / x.total, 'var(--si)', 'rgba(var(--rgb),.2)', 10, 'var(--surface)') + '<span class="g">' + glyph(s) + '</span></span>' +
'<span class="st-go">' + I.next + '</span></span>' +
'<span class="st-n">' + sname(s) + '</span><span class="st-t">' + sname2(s) + '</span>' +
'<span class="st-m">' + (x.done ? frac(x.done, x.total) + ' ' + T('done') + ' · ' + pct + '%' : x.total + ' ' + T('questions')) + '</span>' +
'<span class="st-wm" aria-hidden="true">' + glyph(s) + '</span></button>';
});
return h + '</div>' + credit() + disclaimer() + '</main>';
}
function arow(a, c, icon, t1, t2, off) {
return '<button class="row" data-a="' + a + '"' + (off ? ' disabled' : '') + '><span class="ri ' + c + '">' + icon + '</span><span class="rb"><span class="r1">' + t1 + '</span>' +
'<span class="r2">' + t2 + '</span></span>' + chev() + '</button>';
}
function vSubject(sid) {
var s = S[sid], x = stats(sid), mis = mistakes(sid).length, n = nextPractice(sid), pct = pctOf(x.done, x.total);
var started = x.done > 0 || st.last[sid] !== undefined, t = st.test && st.test.sid === sid ? st.test : null;
var h = '<div class="sx" style="' + sv(s) + '">' + appbar({ back: true, s: s, title: sname(s), sub: sname2(s), right: sizeBtn() });
h += '<main class="wrap subj"><section class="shero"><div class="top"><div class="bring">' + arc(x.done / x.total, 'var(--si)', 'rgba(var(--rgb),.2)', 9, 'var(--surface)') +
'<span class="g">' + pct + '<small>%</small></span></div><div style="flex:1;min-width:0"><div class="big">' + fmtN(x.done) + ' <small>/ ' + fmtN(x.total) + ' ' + T('progress') + '</small></div>' +
'<div class="chipsr"><span class="sc ok">' + I.check + x.ok + ' ' + T('correct') + '</span><span class="sc bad">' + I.cross + x.bad + ' ' + T('wrong') + '</span></div></div></div>' +
'<span class="st-wm" aria-hidden="true">' + glyph(s) + '</span>' +
'<button class="btn btn-subj" data-a="practice">' + I.play + '<span class="l">' + (started ? T('contPractice') : T('startPractice')) +
' <span class="l2">· ' + T('q') + n + '</span></span></button></section>';
h += '<div class="group acts">';
h += arow('grid', 'v', I.grid, T('goTo'), T('goToSub'));
h += arow('mistakes', 'r', I.redo, T('mistakes'), mis ? mis + ' ' + T('mistakesSub') : T('noMistakes'), !mis);
if (t && !t.end) {
h += arow('resumetest', 'a', I.clock, T('contTest'), frac(Object.keys(t.picks).length, t.list.length) + ' ' + T('progress'));
} else {
h += arow('test', 'a', I.clock, T('test'), T('testSub'));
if (t && t.end) { var r = testScore(); h += arow('result', 'g', I.flag, T('lastTest') + ': ' + r.ok + ' / ' + t.list.length, T('seeAnswers')); }
}
h += '</div>';
h += x.done ? '<button class="text-btn" data-a="clearsub">' + T('clearSubject') + '</button>' : '<div style="height:1.5rem"></div>';
return h + '</main></div>';
}
function listOf(b) { return b.mode === 'practice' ? null : b.mode === 'mistakes' ? b.list : st.test.list; }
function lenOf(b) { var l = listOf(b); return l ? l.length : S[b.sid].count; }
function nAt(b, i) { var l = listOf(b); return l ? l[i] : i + 1; }
function posOf(b, n) { var l = listOf(b); return l ? l.indexOf(n) : n - 1; }
function pickOf(b, n) {
if (b.mode === 'practice') return (st.ans[b.sid] || {})[n] || 0;
if (b.mode === 'mistakes') return b.picks[n] || 0;
return (st.test && st.test.picks[n]) || 0;
}
function answeredIn(b) {
if (b.mode === 'practice') return stats(b.sid).done;
if (b.mode === 'mistakes') return Object.keys(b.picks).length;
return Object.keys(st.test.picks).length;
}
function card(b, n, just) {
var s = S[b.sid], q = s.qs[n - 1], ans = _b4(s, n), pk = pickOf(b, n);
var reveal = b.mode === 'review' || (b.mode !== 'test' && pk > 0);
var h = '<article class="card qcard" id="c-' + n + '"><div class="qhead' + (q[4] ? ' hz' : '') + '"><span class="qn">' + n + '</span>';
if (q[4]) {
h += '<button class="zm" data-a="zoom" data-n="' + n + '" data-k="0" aria-label="' + T('enlarge') + '">' + I.zoom + '</button><div class="pics">';
q[4].forEach(function (im, k) {
h += '<button class="pic" data-a="zoom" data-n="' + n + '" data-k="' + k + '" aria-label="' + T('enlarge') + '" style="width:' + (im[1] * D.imgEm).toFixed(2) + 'em">' +
'<span class="pr" style="padding-top:' + (100 * im[2] / im[1]).toFixed(2) + '%"><img loading="lazy" alt="' + T('question') + ' ' + n +
'" src="' + _a4(im[0]) + '"' + (typeof im[0] === 'string' && im[0].indexOf('img/') === 0 ? ' data-p="' + im[0] + '"' : '') + ' width="' + im[1] + '" height="' + im[2] + '"></span>' +
'</button>';
});
h += '</div>';
} else {
h += '<div class="stem">' + q[1] + '</div>';
}
h += '</div><div class="opts' + (q[4] ? ' nums' : q[5] === 4 ? ' o4' : q[5] === 2 ? ' o2' : '') + '">';
for (var k = 1; k <= 4; k++) {
var cls = 'opt', mk = '';
if (reveal) {
if (k === ans) { cls += ' ok'; mk = I.check; if (just && pk === ans) cls += ' just'; }
else if (k === pk) { cls += ' bad' + (just ? ' just' : ''); mk = I.cross; }
else cls += ' faded';
} else if (pk === k) cls += ' sel';
h += '<button class="' + cls + '" data-a="pick" data-n="' + n + '" data-k="' + k + '"' + (reveal ? ' disabled' : '') + ' aria-label="' + k + '">' +
'<span class="num">' + k + '</span>' + (q[4] ? '' : '<span class="txt">' + q[2][k - 1] + '</span>') +
(mk ? '<span class="mk">' + mk + '</span>' : '') + '</button>';
}
h += '</div>';
if (reveal) {
var again = b.mode === 'practice' ? '<button class="again" data-a="retry" data-n="' + n + '">' + I.redo + T('tryAgain') + '</button>' : '';
var pr = T('praise');
var jc = just ? ' just' : '';
if (pk === ans) h += '<div class="fb ok' + jc + '">' + I.checkC + '<span class="fx"><b>' + pr[n % pr.length] + '</b></span>' + again + '</div>';
else if (pk) h += '<div class="fb bad' + jc + '">' + I.crossC + '<span class="fx">' + T('notQuite') + ' <b>' + ans + '</b></span>' + again + '</div>';
else h += '<div class="fb bad">' + I.minusC + '<span class="fx"><b>' + T('skipped') + '</b> ' + T('rightIs') + ' <b>' + ans + '</b></span></div>';
}
return h + '</article>';
}
function tail(b) {
var len = lenOf(b);
if (b.end < len) return '<div id="tail"><button class="more" data-a="more">' + I.down + T('more') + '</button></div>';
if (b.mode === 'test') return '<div id="tail"></div>';
return '<div id="tail"><p class="endnote">' + I.spark + (b.mode === 'mistakes' ? T('endMistakes') : T('endList')) + '</p></div>';
}
function counter(b) { return frac(answeredIn(b), lenOf(b)) + ' ' + T('progress'); }
function vList(b) {
var s = S[b.sid], len, title, right = sizeBtn();
if (b.mode === 'practice') { title = sname(s); right = '<button class="icon-btn" data-a="grid" aria-label="' + T('goTo') + '">' + I.grid + '</button>' + right; }
else if (b.mode === 'mistakes') title = T('myMistakes') + ' · ' + sname(s);
else { title = T('testT') + ' · ' + sname(s); right = '<span class="pill timer" id="timer">' + mmss((Date.now() - st.test.start) / 1000) + '</span>'; }
len = lenOf(b);
if (b.end > len) { b.end = len; if (b.start > len) b.start = Math.max(0, len - CHUNK); }
var h = '<div class="sx" style="' + sv(s) + '">' + appbar({ back: true, s: s, title: title, sub: '<span id="cnt">' + (s.qs ? counter(b) : '') + '</span>', right: right,
after: s.qs ? '<div class="progress-line"><i id="pl" style="width:' + (100 * answeredIn(b) / len).toFixed(1) + '%"></i></div>' : '' });
if (!s.qs) return h + loadingView(s.id) + '</div>';
h += '<main class="wrap qlist' + (b.mode === 'test' ? ' has-bar' : '') + '">';
if (b.start > 0) h += '<button class="more" data-a="earlier">' + I.up + T('earlier') + '</button>';
h += '<div id="qs">';
for (var i = b.start; i < b.end; i++) h += card(b, nAt(b, i));
h += '</div>' + tail(b) + '</main>';
if (b.mode === 'test') {
h += '<nav class="bottombar"><div class="in"><div class="info"><b><span id="tcount">' + frac(answeredIn(b), len) + '</span> ' + T('progress') + '</b></div>' +
'<button class="btn btn-success" data-a="submit">' + I.check + '<span class="l">' + T('submit') + '</span></button></div></nav>';
}
return h + '</div>';
}
function redraw(b, n, just) {
var el = document.getElementById('c-' + n); if (el) { el.outerHTML = card(b, n, just); _a5(); }
var c = document.getElementById('cnt'); if (c) c.innerHTML = counter(b);
var tc = document.getElementById('tcount'); if (tc) tc.textContent = frac(answeredIn(b), lenOf(b));
var pl = document.getElementById('pl'); if (pl) pl.style.width = (100 * answeredIn(b) / lenOf(b)).toFixed(1) + '%';
}
function more() {
var b = base(); if (b.v !== 'list' || !S[b.sid].qs) return;
var len = lenOf(b); if (b.end >= len) return;
var from = b.end, h = '';
b.end = Math.min(len, b.end + CHUNK);
for (var i = from; i < b.end; i++) h += card(b, nAt(b, i));
document.getElementById('qs').insertAdjacentHTML('beforeend', h);
_a5();
var t = document.getElementById('tail'); if (t) t.outerHTML = tail(b);
watchTail();
}
function earlier() {
var b = base(); if (b.v !== 'list' || b.start <= 0) return;
var from = Math.max(0, b.start - CHUNK), h = '', doc = document.documentElement, before = doc.scrollHeight, y = window.pageYOffset;
for (var i = from; i < b.start; i++) h += card(b, nAt(b, i));
b.start = from;
document.getElementById('qs').insertAdjacentHTML('afterbegin', h);
_a5();
if (b.start === 0) { var eb = document.querySelector('[data-a="earlier"]'); if (eb) eb.parentNode.removeChild(eb); }
window.scrollTo(0, y + (doc.scrollHeight - before));
}
function watchTail() {
if (io) { io.disconnect(); io = null; }
var b = base(), t = document.getElementById('tail');
if (!t || b.v !== 'list' || b.end >= lenOf(b) || !('IntersectionObserver' in window)) return;
io = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) more(); }, { rootMargin: '800px 0px' });
io.observe(t);
}
function scrollToCard(n) {
var el = document.getElementById('c-' + n); if (!el) return;
var bar = document.querySelector('.appbar'), off = (bar ? bar.offsetHeight : 0) + 8;
window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - off));
}
function openList(sid, mode, n, extra) {
var s = { v: 'list', mode: mode, sid: sid, start: 0, end: 0, focus: 0 };
if (extra) Object.keys(extra).forEach(function (k) { s[k] = extra[k]; });
var len = lenOf(s), p = n ? Math.max(0, posOf(s, n)) : 0;
s.start = mode === 'test' ? 0 : p;
s.end = mode === 'test' ? len : Math.min(len, s.start + FIRST);
if (mode === 'test' && n) s.focus = n;
return s;
}
function pick(n, k) {
var b = base(); if (b.v !== 'list' || b.mode === 'review') return;
if (b.mode === 'test') { st.test.picks[n] = k; save(); redraw(b, n); return; }
if (pickOf(b, n)) return;
var a = st.ans[b.sid] || (st.ans[b.sid] = {});
a[n] = k;
if (b.mode === 'mistakes') b.picks[n] = k; else st.last[b.sid] = n;
setLast(b.sid);
var cnt = logAnswer(), right = k === _b4(S[b.sid], n);
answered(b.sid, [[n, right]]);
run = right ? run + 1 : 0;
save(); redraw(b, n, true);
if (cnt === 1 && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
if (right && run >= 5 && run % 5 === 0) { toast(T('inRow').replace('{n}', run)); confetti(22); }
}
function setLast(sid) { st.lastSid = sid; st.lastBy[paperOfS(S[sid]).id] = sid; }
function lastOfPaper() {
var x = sub(st.lastBy[curPaper()]), most = 0;
if (x && paperOfS(x).id === curPaper()) return x;
x = null;
subjectsOf(curPaper()).forEach(function (s) {
var n = Object.keys(obj(st.ans[s.id]) ? st.ans[s.id] : {}).length;
if (st.last[s.id] && (!x || n > most)) { x = s; most = n; }
});
return x;
}
function pctOf(d, t) { if (!d) return 0; var p = Math.round(100 * d / t); return d < t ? Math.min(99, Math.max(1, p)) : 100; }
function openTest() { return st.test && !st.test.end && paperOfS(S[st.test.sid]).id === curPaper() ? st.test : null; }
function pname(s) { return (PAPERS.length > 1 ? paperOfS(s).id + ' · ' : '') + sname(s); }
function firstOpen() { for (var i = 0; i < st.test.list.length; i++) if (!st.test.picks[st.test.list[i]]) return st.test.list[i]; return 0; }
function startPractice(sid, n) { st.last[sid] = n; setLast(sid); save(); go(openList(sid, 'practice', n)); }
function testScore() {
var t = st.test, ok = 0, bad = 0, none = 0, s = S[t.sid];
t.list.forEach(function (n) { var p = t.picks[n], a = _b4(s, n); if (!p) none++; else if (p === a) ok++; else bad++; });
return { ok: ok, bad: bad, none: none };
}
function finishTest() {
var t = st.test, left = t.list.length - Object.keys(t.picks).length;
if (left > 0 && !window.confirm(T('confirmFinish').replace('{n}', left))) return;
t.end = Date.now(); save();
var tl = []; t.list.forEach(function (x) { if (t.picks[x]) tl.push([x, t.picks[x] === _b4(S[t.sid], x)]); });
answered(t.sid, tl, true);
stack[stack.length - 1] = { v: 'result', sid: t.sid };
render(true);
if (testScore().ok >= 0.8 * t.list.length) confetti(44);
}
function vResult(b) {
var t = st.test, s = S[t.sid];
var h = '<div class="sx" style="' + sv(s) + '">' + appbar({ back: true, s: s, title: T('result'), sub: sname(s) });
if (!s.qs) return h + loadingView(s.id) + '</div>';
var r = testScore(), len = t.list.length, pct = Math.round(100 * r.ok / len);
var col = pct >= 80 ? 'url(#ringgrad)' : pct >= 60 ? 'var(--ok)' : pct >= 40 ? 'var(--warn)' : 'var(--bad)';
h += '<main class="wrap qlist"><section class="score" style="margin-top:0"><div class="ring">' + arc(pct / 100, col, 'var(--ring-track)', 11, '', GRAD) +
'<div class="v"><b>' + r.ok + '/' + len + '</b><span>' + pct + '%</span></div></div><div style="flex:1;min-width:0">' +
'<div class="msg">' + (pct >= 80 ? T('excellent') : pct >= 60 ? T('good') : T('keep')) + '</div>' +
'<div class="tm">' + I.clock + T('time') + ' ' + mmss((t.end - t.start) / 1000) + '</div>' +
'<div class="sub"><span class="sc ok">' + I.check + r.ok + ' ' + T('correct') + '</span><span class="sc bad">' + I.cross + r.bad + ' ' + T('wrong') + '</span>' +
'<span class="sc n">' + I.minusC + r.none + ' ' + T('notAnswered') + '</span></div></div></section>';
h += '<div class="pair"><button class="btn btn-primary" data-a="test">' + I.redo + '<span class="l">' + T('newTest') + '</span></button>' +
'<button class="btn btn-secondary" data-a="home">' + I.home + '<span class="l">' + T('home') + '</span></button></div>';
h += '<div class="label">' + T('answers') + '</div>';
var rb = { mode: 'review', sid: t.sid };
t.list.forEach(function (n) { h += card(rb, n); });
return h + '</main></div>';
}
function sheet(title, body, foot) {
return '<div class="sheet" data-a="noop" role="dialog" aria-modal="true"><div class="sh-h"><h2>' + title + '</h2>' +
'<button class="close" data-a="close" aria-label="' + T('close') + '">' + I.close + '</button></div>' +
'<div class="sh-b">' + body + '</div>' + (foot ? '<div class="sh-f">' + foot + '</div>' : '') + '</div>';
}
function seg(n, items, cls) {
return '<div class="seg seg' + n + (cls ? ' ' + cls : '') + '">' + items.map(function (it) {
return '<button class="' + (it[3] ? 'on' : '') + '" data-a="' + it[0] + '" data-v="' + it[1] + '">' + it[2] + '</button>';
}).join('') + '</div>';
}
function oSettings() {
var z = st.set.size, q = st.set.q;
var body = '<div class="set-l">' + T('size') + '</div>' + seg(3, [
['size', 1, '<span class="A" style="font-size:.9rem">A</span>' + T('normal'), z === 1],
['size', 2, '<span class="A" style="font-size:1.1rem">A</span>' + T('large'), z === 2],
['size', 3, '<span class="A" style="font-size:1.3rem">A</span>' + T('xlarge'), z === 3]]) +
'<div class="set-l">' + T('menuLang') + '</div>' + seg(2, [['ui', 'en', 'English', st.set.ui === 'en'], ['ui', 'te', 'తెలుగు', st.set.ui === 'te']]) +
'<div class="set-l">' + T('qLang') + '</div>' + seg(3, [['q', 'both', T('both'), q === 'both'], ['q', 'en', 'English', q === 'en'], ['q', 'te', 'తెలుగు', q === 'te']]) +
'<div class="set-l">' + T('screen') + '</div>' + seg(2, [['dark', 0, T('light'), !st.set.dark], ['dark', 1, T('dark'), !!st.set.dark]]) +
'<button class="linkrow" data-a="help">' + I.help + T('howTo') + '</button>' +
'<button class="danger" data-a="clearall">' + T('clearAll') + (PAPERS.length > 1 ? ' · ' + (te() ? paperOf(curPaper()).te : paperOf(curPaper()).name) : '') + '</button>';
return sheet(T('settings'), body, '<button class="btn btn-primary" data-a="close">' + T('finished') + '</button>');
}
function oHelp() {
var body = '<ol class="steps" style="margin-top:.3rem">' + T('steps').map(function (s, i) { return '<li style="padding-left:0;padding-right:0"><span class="n">' + (i + 1) + '</span><span>' + s + '</span></li>'; }).join('') + '</ol>';
return sheet(T('howTo'), body, '<button class="btn btn-primary" data-a="close">OK</button>');
}
function oGrid(o) {
var s = S[o.sid], a = st.ans[o.sid] || {}, cur = st.last[o.sid];
var nb = Math.ceil(s.count / 60), blk = o.blk || 0, h = '<div class="chips">';
for (var i = 0; i < nb; i++) {
h += '<button class="chip' + (i === blk ? ' on' : '') + '" data-a="blk" data-v="' + i + '">' + (i * 60 + 1) + '–' + Math.min(s.count, (i + 1) * 60) + '</button>';
}
h += '</div><div class="nums-grid">';
for (var n = blk * 60 + 1; n <= Math.min(s.count, blk * 60 + 60); n++) {
var p = a[n], c = !p ? '' : p === _b4(s, n) ? ' g' : ' r';
h += '<button class="cell' + c + (n === cur ? ' cur' : '') + '" data-a="jump" data-v="' + n + '">' + n + '</button>';
}
h += '</div><div class="legend"><span><i class="dot g"></i>' + T('legendOk') + '</span><span><i class="dot r"></i>' + T('legendBad') + '</span><span><i class="dot n"></i>' + T('legendNot') + '</span></div>';
return sheet(T('pickTitle') + ' · ' + sname(s), h);
}
function oTestSize(o) {
var s = S[o.sid], sizes = [10, 20, 30, 50].filter(function (k) { return k <= s.count; });
var body = '<p class="muted" style="margin:.5rem 0 .8rem;font-size:.88rem">' + T('howManySub') + '</p>' +
seg(sizes.length, sizes.map(function (k) { return ['tstart', k, k + '<small>' + T('questions') + '</small>', false]; }), 'big') + '<div style="height:.4rem"></div>';
return sheet(T('howMany') + ' · ' + sname(s), body);
}
function oZoom(o) {
var q = S[o.sid].qs[o.n - 1];
return '<div class="zoom" data-a="noop">' + q[4].map(function (im) {
return '<img src="' + _a4(im[0]) + '"' + (typeof im[0] === 'string' && im[0].indexOf('img/') === 0 ? ' data-p="' + im[0] + '"' : '') + ' alt="" style="width:' + (im[1] * D.imgEm * 1.6).toFixed(2) + 'em;margin-bottom:.6rem">';
}).join('') + '</div>' +
'<button class="close zoom-x" data-a="close" aria-label="' + T('close') + '">' + I.close + '</button>';
}
function applySettings() {
var h = document.documentElement, c = [];
if (st.set.size === 2) c.push('s2'); if (st.set.size === 3) c.push('s3');
if (st.set.dark) c.push('dark');
if (st.set.q === 'en' || st.set.q === 'te') c.push('q-' + st.set.q);
if (curPaper() === '1A') c.push('p1a');
h.className = c.join(' ');
h.setAttribute('lang', te() ? 'te' : 'en');
var m = document.querySelector('meta[name="theme-color"]');
if (m) m.setAttribute('content', curPaper() === '1A' ? (st.set.dark ? '#0B1614' : '#F1F8F6') : (st.set.dark ? '#100E1A' : '#F6F4FB'));
}
function act(a, el) {
var v = el.getAttribute('data-v'), n = +el.getAttribute('data-n'), b = base(), t = top();
switch (a) {
case 'noop': return;
case 'close': case 'back': back(); return;
case 'home': goHome(); return;
case 'settings': go({ ov: 'settings' }); return;
case 'help': go({ ov: 'help' }); return;
case 'ui':
st.set.ui = v; save(); applySettings(); dirty = true; render(false);
if (t.ov) ov.innerHTML = overlay(t);
return;
case 'begin': st.welcomed = true; save(); stack[0] = { v: 'home' }; render(true); warmPaper(curPaper()); return;
case 'subject':
var ss = S[el.getAttribute('data-s')]; if (!ss) return;
if (paperOfS(ss).id !== curPaper()) { st.paper = paperOfS(ss).id; save(); applySettings(); }
go({ v: 'subject', sid: ss.id }); return;
case 'paper': st.paper = v; save(); applySettings(); dirty = true; render(false); warmPaper(v); return;
case 'resume':
var lsub = lastOfPaper(); if (!lsub) return;
var sid = lsub.id;
go({ v: 'subject', sid: sid }, true); startPractice(sid, nextPractice(sid)); return;
case 'practice': startPractice(b.sid, nextPractice(b.sid)); return;
case 'grid':
var gn = st.last[b.sid] || 1;
go({ ov: 'grid', sid: b.sid, blk: Math.floor((gn - 1) / 60) }); return;
case 'blk': t.blk = +v; ov.innerHTML = overlay(t); showChip(); return;
case 'jump':
var jn = +v, js = t.sid;
back(function () {
var bb = base();
st.last[js] = jn; setLast(js); save();
if (bb.v === 'list' && bb.mode === 'practice') {
if (jn - 1 >= bb.start && jn - 1 < bb.end) { render(false); scrollToCard(jn); }
else { bb.start = jn - 1; bb.end = Math.min(S[js].count, bb.start + FIRST); dirty = true; render(true); }
} else go(openList(js, 'practice', jn));
});
return;
case 'pick': pick(n, +el.getAttribute('data-k')); return;
case 'more': more(); return;
case 'earlier': earlier(); return;
case 'retry': if (st.ans[b.sid]) delete st.ans[b.sid][n]; save(); redraw(b, n); return;
case 'reload':
var LL = loads[el.getAttribute('data-s')];
if (LL) { LL.tries = (LL.tries || 0) + 1; if (LL.tries > 2) { location.reload(); return; } }
_b6(el.getAttribute('data-s')); refresh(); return;
case 'mistakes':
var ml = mistakes(b.sid); if (!ml.length) return;
go(openList(b.sid, 'mistakes', 0, { list: ml, picks: {} })); return;
case 'test': go({ ov: 'testsize', sid: b.sid }); return;
case 'tstart':
var ot = st.test || held;
if (ot && !ot.end && ot.sid !== t.sid &&
!window.confirm(T('confirmReplaceTest').replace('{s}', st.test ? pname(S[ot.sid]) : T('otherPaper')))) return;
held = null;
var ts = t.sid, all = [];
for (var qn = 1; qn <= S[ts].count; qn++) all.push(qn);
st.test = { sid: ts, list: shuffle(all).slice(0, +v).sort(function (x, y) { return x - y; }), picks: {}, start: Date.now(), end: 0 };
count(ts, 2);
save();
back(function () {
var tq = openList(ts, 'test', 0);
if (base().v === 'result') { stack[stack.length - 1] = tq; render(true); } else go(tq);
});
return;
case 'resumetest': go(openList(b.sid, 'test', firstOpen())); return;
case 'hometest':
var ht = openTest(); if (!ht) return;
go({ v: 'subject', sid: ht.sid }, true); go(openList(ht.sid, 'test', firstOpen())); return;
case 'reloadpage': location.reload(); return;
case 'submit': finishTest(); return;
case 'result': go({ v: 'result', sid: b.sid }); return;
case 'zoom': go({ ov: 'zoom', sid: b.sid, n: n, k: +el.getAttribute('data-k') }); return;
case 'size': keepPlace(function () { st.set.size = +v; save(); applySettings(); }); ov.innerHTML = overlay(t); return;
case 'q': keepPlace(function () { st.set.q = v; save(); applySettings(); }); ov.innerHTML = overlay(t); return;
case 'dark': st.set.dark = v === '1'; save(); applySettings(); ov.innerHTML = overlay(t); return;
case 'clearall':
var cp = curPaper(), cpo = paperOf(cp);
if (!window.confirm(T('confirmClearAll').replace('{p}', te() ? cpo.te : cpo.name))) return;
subjectsOf(cp).forEach(function (s) { delete st.ans[s.id]; delete st.last[s.id]; });
delete st.lastBy[cp];
if (sub(st.lastSid) && paperOfS(S[st.lastSid]).id === cp) st.lastSid = '';
if (st.test && paperOfS(S[st.test.sid]).id === cp) st.test = null;
save(); dirty = true;
back(function () { goHome(); if (stack.length === 1) render(true); });
return;
case 'clearsub':
if (!window.confirm(T('confirmClearSub').replace('{s}', sname(S[b.sid])))) return;
delete st.ans[b.sid]; delete st.last[b.sid]; if (st.lastSid === b.sid) st.lastSid = '';
Object.keys(st.lastBy).forEach(function (p) { if (st.lastBy[p] === b.sid) delete st.lastBy[p]; });
if (st.test && st.test.sid === b.sid) st.test = null;
save(); refresh(); return;
}
}
var tapBusy = false, NOW = { pick: 1, noop: 1, retry: 1, more: 1, earlier: 1, size: 1, q: 1, dark: 1, ui: 1, blk: 1 };
document.addEventListener('click', function (e) {
var el = e.target;
while (el && el !== document && !(el.getAttribute && el.getAttribute('data-a'))) el = el.parentNode;
if (!el || el === document || el.disabled) return;
if (el === ov) { back(); return; }
var a = el.getAttribute('data-a');
if (NOW[a] || !window.requestAnimationFrame) { act(a, el); return; }
if (tapBusy) return;
tapBusy = true;
if (el.classList) el.classList.add('tap');
requestAnimationFrame(function () {
setTimeout(function () {
tapBusy = false;
if (el.classList) el.classList.remove('tap');
act(a, el);
}, 0);
});
});
ov.setAttribute('data-a', 'close');
ov.addEventListener('click', function () {});
function resync() {
var r = null;
try { r = window.localStorage.getItem(KEY); } catch (e) { return; }
if (r === lastRaw) return;
if (r === null && lastRaw !== null) { save(); return; }
if (r !== null && !parses(r)) { save(); return; }
var was = st.test ? st.test.start + '|' + !!st.test.end : '';
lastRaw = r; load(r); applySettings();
var b = base(), now = st.test ? st.test.start + '|' + !!st.test.end : '';
if ((b.v === 'result' || (b.v === 'list' && b.mode === 'test')) && (now !== was || !(st.test && st.test.sid === b.sid))) { goHome(); return; }
refresh();
}
window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) resync(); });
window.addEventListener('pageshow', function (e) { if (e.persisted) resync(); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) resync(); });
['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (ev) {
document.addEventListener(ev, function (e) { e.preventDefault(); }, true);
});
document.addEventListener('keydown', function (e) {
var k = (e.key || '').toLowerCase();
if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 's' || k === 'p' || k === 'u' || k === 'a')) { e.preventDefault(); return; }
}, true);
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && top().ov) back();
});
var STATS = typeof D.stats === 'string' ? D.stats : '', sx = {}, sxBusy = false;
function rid() {
var a = 'abcdefghijklmnopqrstuvwxyz0123456789', r = null, out = '';
try { r = window.crypto.getRandomValues(new Uint8Array(16)); } catch (e) {}
for (var i = 0; i < 16; i++) out += a.charAt((r ? r[i] : Math.floor(Math.random() * 256)) % 36);
return out;
}
function sxSave() { try { window.localStorage.setItem(SKEY, JSON.stringify(sx)); } catch (e) {} }
function sxLoad() {
var o = null;
try { o = JSON.parse(window.localStorage.getItem(SKEY) || 'null'); } catch (e) {}
sx = obj(o) ? o : {};
['q', 'd', 'w', 'm', 'e'].forEach(function (k) {
if (!obj(sx[k])) sx[k] = {};
else if (k !== 'e' && Object.keys(sx[k]).length > 15) sx[k] = recent(sx[k], 15);
});
if (typeof sx.id !== 'string' || !/^[a-z0-9]{16}$/.test(sx.id)) { sx.id = rid(); sxSave(); }
}
function tally(sid, k, n) {
var day = dayKey(), per = obj(sx.q[day]) ? sx.q[day] : (sx.q[day] = {}), r = per[sid] || (per[sid] = [0, 0, 0, 0]);
r[k] += n === undefined ? 1 : n;
}
function count(sid, k, n) { if (!STATS) return; try { sxLoad(); tally(sid, k, n); sxSave(); } catch (e) {} }
function answered(sid, list, test) {
if (!STATS) return;
try {
sxLoad();
var day = dayKey(), per = obj(sx.w[day]) ? sx.w[day] : (sx.w[day] = {}), qs = obj(per[sid]) ? per[sid] : (per[sid] = {}), ok = 0;
list.forEach(function (x) { var r = qs[x[0]] || (qs[x[0]] = [0, 0]); r[0]++; if (x[1]) { r[1]++; ok++; } });
tally(sid, 0, list.length); tally(sid, 1, ok); if (test) tally(sid, 3);
sxSave();
} catch (e) {}
}
function daySum() { var d = dayKey(); return obj(sx.m[d]) ? sx.m[d] : (sx.m[d] = { t: 0, s: 0, h: 0 }); }
function recent(o, keep) {
var ks = Object.keys(o).sort().slice(-keep), out = {};
ks.forEach(function (k) { out[k] = o[k]; });
return out;
}
function appMode() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone ? 1 : 0; }
var GAPS = { open: 600000, beat: 900000, online: 180000, leave: 180000, first: 60000 };
function sendUsage(kind) {
if (!STATS || sxBusy || navigator.onLine === false || !window.fetch) return;
try {
sxLoad();
var now = Date.now(), since = now - (sx.t || 0), today = dayKey();
var study = obj(sx.p) || Object.keys(sx.q).length > 0 || Object.keys(sx.w).length > 0;
if (kind !== 'open' && !study) return;
var gap = kind === 'leave' && sx.lk === 'open' ? GAPS.first : GAPS[kind] || GAPS.beat;
if (since < gap && now >= (sx.t || 0)) return;
sx.d[today] = 1;
if (obj(sx.p) && now - (sx.p.c || now) > 3 * 864e5) sx.p = null;
if (!obj(sx.p)) {
var past = {};
Object.keys(sx.m).forEach(function (d) { if (d < today) past[d] = sx.m[d]; });
sx.n = (sx.n || 0) + 1;
sx.p = { n: sx.n, c: now, q: recent(sx.q, 14), w: recent(sx.w, 14), d: Object.keys(recent(sx.d, 14)), o: sx.o || 0, m: recent(past, 14), e: sx.e, f: sx.off || 0 };
if (JSON.stringify(sx.p).length > 50000) sx.p.w = {};
sx.q = {}; sx.w = {}; sx.d = {}; sx.o = 0; sx.e = {}; sx.off = 0;
Object.keys(past).forEach(function (d) { delete sx.m[d]; });
}
var tm = daySum(), nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
var body = JSON.stringify({
id: sx.id, v: 2, k: kind, p: st.welcomed ? curPaper() : '', a: appMode(), ver: D.ver || '',
s: { ui: st.set.ui, ql: st.set.q, sz: st.set.size, dk: st.set.dark ? 1 : 0, vw: Math.round(window.innerWidth || 0), src: sx.src || '', ld: nav ? Math.round(nav.domContentLoadedEventEnd || 0) : 0 },
t: { t: tm.t || 0, s: tm.s || 0, h: tm.h || 0 }, b: sx.p
}), sent = sx.p.n;
sxBusy = true; sx.t = now; sx.lk = kind; sxSave();
window.fetch(STATS, { method: 'POST', body: body, keepalive: true, credentials: 'omit' }).then(function (r) {
sxBusy = false;
sxLoad();
if (!obj(sx.p) || sx.p.n !== sent) return;
if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429)) { sx.p = null; sxSave(); }
}, function () { sxBusy = false; });
} catch (e) { sxBusy = false; }
}
function noteError(msg) {
if (!STATS) return;
try {
msg = String(msg || '').replace(/(https?|blob|file):\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 100);
if (!msg || /^Script error\.?$/i.test(msg)) return;
sxLoad();
if (!sx.e[msg] && Object.keys(sx.e).length >= 5) return;
sx.e[msg] = (sx.e[msg] || 0) + 1; sxSave();
} catch (e) {}
}
if (STATS) { try { window.localStorage.setItem(SKEY + '-t', '1'); if (window.localStorage.getItem(SKEY + '-t') !== '1') STATS = ''; window.localStorage.removeItem(SKEY + '-t'); } catch (e) { STATS = ''; } }
if (STATS) {
var touched = Date.now(), hiddenAt = 0;
sxLoad();
if (!sx.src) {
var ref = (document.referrer || '') + ' ' + location.search;
sx.src = appMode() ? 'home' : /whatsapp/i.test(ref) ? 'whatsapp' : /telegram|t\.me/i.test(ref) ? 'telegram' :
/facebook|fbclid|instagram/i.test(ref) ? 'facebook' : /youtube|youtu\.be/i.test(ref) ? 'youtube' : /google\./i.test(ref) ? 'google' :
document.referrer && document.referrer.indexOf(location.host) < 0 ? 'other' : 'direct';
}
sx.o = (sx.o || 0) + 1; sx.d[dayKey()] = 1;
if (navigator.onLine === false) sx.off = (sx.off || 0) + 1;
var m0 = daySum(); if (Date.now() - (sx.la || 0) > 1800000) m0.s = (m0.s || 0) + 1;
m0.h = (m0.h || 0) | (1 << new Date().getHours()); sx.la = Date.now();
sxSave();
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
document.addEventListener(ev, function () { touched = Date.now(); }, { passive: true, capture: true });
});
setInterval(function () {
if (document.hidden || Date.now() - touched > 90000) return;
try { sxLoad(); var m = daySum(); m.t = (m.t || 0) + 15; m.h = (m.h || 0) | (1 << new Date().getHours()); sx.la = Date.now(); sxSave(); } catch (e) {}
}, 15000);
setTimeout(function () { sendUsage('open'); }, 3000);
setInterval(function () { if (!document.hidden) sendUsage('beat'); }, 60000);
window.addEventListener('online', function () { if (!document.hidden) sendUsage('online'); });
document.addEventListener('visibilitychange', function () {
if (document.hidden) { hiddenAt = Date.now(); try { sxLoad(); sx.la = hiddenAt; sxSave(); } catch (e) {} sendUsage('leave'); return; }
if (hiddenAt && Date.now() - hiddenAt > 1800000) {
try { sxLoad(); var m = daySum(); m.s = (m.s || 0) + 1; m.h = (m.h || 0) | (1 << new Date().getHours()); sxSave(); } catch (e) {}
sendUsage('open');
}
touched = Date.now();
});
window.addEventListener('error', function (e) { noteError(e && e.message); });
window.addEventListener('unhandledrejection', function (e) { noteError('promise: ' + (e && e.reason && (e.reason.message || e.reason))); });
}
applySettings();
render(true);
function warmAll() {
if (st.welcomed) warmPaper(curPaper());
_b2(D.subjects.filter(function (s) { return s.file && !s.qs && !(st.welcomed && paperOfS(s).id === curPaper()); }).map(function (s) { return s.file; }));
prune();
}
function prune() {
if (!window.caches || !caches.keys) return;
var now = {}; D.subjects.forEach(function (s) { if (s.file) now[s.file] = 1; });
if (!Object.keys(now).length) return;
caches.keys().then(function (ks) {
ks.forEach(function (k) { caches.open(k).then(function (c) { c.keys().then(function (rs) { rs.forEach(function (r) {
var m = /\/(data\/[0-9a-f]+\.txt)$/.exec(r.url); if (m && !now[m[1]]) c['delete'](r);
}); }); }); });
})['catch'](function () {});
}
setTimeout(warmAll, 5000);
if (SWK) navigator.serviceWorker.addEventListener('controllerchange', function () {
warmSeen = {}; warmQ = []; warming = false; setTimeout(warmAll, 1500);
});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && D.sw) {
window.addEventListener('load', function () { navigator.serviceWorker.register(D.sw).catch(function () {}); });
}
})();
