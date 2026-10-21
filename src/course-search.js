import {allSections} from './course-data.js';
import {readingNotes} from './reading-notes.js';
import {codeGuide, guideSource} from './code-guide.js';
import {codeLabs, programSource} from './code-labs.js';
import {lessonSteps} from './lesson-steps.js';

const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp);/g, ' ').replace(/\s+/g, ' ').trim();
const normalize = value => value.normalize('NFKC').toLowerCase();

export function buildSearchIndex() {
  const documents = [];
  function add(section, tab, anchor, title, body, code = false) {
    const clean = code ? value => value.replace(/\s+/g,' ').trim() : plain;
    const text = {zh: clean(body.zh), en: clean(body.en)};
    documents.push({section, tab, anchor, title, text,
      searchable: normalize(`${section.id} ${section.title.zh} ${section.title.en} ${section.api} ${title.zh} ${title.en} ${text.zh} ${text.en}`)});
  }
  for (const section of allSections) {
    let heading = -1, title, body;
    const flush = () => { if (title) add(section, 'explain', `reading-${heading}`, title, body); };
    for (const block of readingNotes[section.id]) {
      if (block.kind === 'h') { flush(); heading++; title = block.text; body = {zh: '', en: ''}; continue; }
      for (const lang of ['zh', 'en']) {
        const value = block.kind === 'p' ? block.text[lang] : block.kind === 'list' ? block.items.map(item => item[lang]).join(' ') :
          block.kind === 'table' ? [block.head[lang], ...block.rows.map(row => row[lang])].flat().join(' ') : '';
        body[lang] += ' ' + value;
      }
    }
    flush();
    codeGuide[section.id].forEach((guide, i) => add(section, 'code', `keycode-${i}`, guide.title,
      Object.fromEntries(['zh', 'en'].map(lang => [lang, `${plain(guide.explanation[lang])} ${guideSource(guide, lang)}`])), true));
    const lab = codeLabs[section.api];
    add(section, 'code', 'syntax-preview', {zh: `运行示例：${lab.title.zh}`, en: `Run example: ${lab.title.en}`},
      Object.fromEntries(['zh', 'en'].map(lang => [lang, programSource(lab, lang)])), true);
    const walkthrough=lessonSteps(section);
    add(section, 'demo', 'demo-workspace', section.title, Object.fromEntries(['zh','en'].map(lang=>[lang,section.watch[lang]+' '+walkthrough.map(step=>step.title[lang]).join(' ')+(section.id==='4.1'?' Crime 1985 male female ratio parallel coordinates 平行坐标 性别差比例':section.id==='4.5'?' terrain10 等值面 二维场':'')])));
  }
  return documents;
}

export function searchCourse(index, query, lang = 'zh', limit = 24) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return index.filter(doc => doc.tab === 'demo').slice(0, 8);
  return index.filter(doc => terms.every(term => doc.searchable.includes(term)))
    .map(doc => ({doc, score: terms.reduce((score, term) => score +
      (normalize(`${doc.title.zh} ${doc.title.en}`).includes(term) ? 8 : 0) +
      (normalize(doc.text[lang]).includes(term) ? 3 : 0) + (normalize(doc.section.api) === term ? 4 : 0), 0)}))
    .sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.doc);
}

// Return text runs rather than HTML. Search terms and source code are escaped
// by the view, including '<', '&' and regular-expression characters.
export function searchExcerpt(doc, query, lang = 'zh', length = 150) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const matching = text => terms.some(term => normalize(text).includes(normalize(term)));
  const source = matching(doc.text[lang]) ? doc.text[lang] : matching(doc.text[lang === 'zh' ? 'en' : 'zh']) ? doc.text[lang === 'zh' ? 'en' : 'zh'] : doc.text[lang];
  const first = terms.map(term => normalize(source).indexOf(normalize(term))).filter(i => i >= 0).sort((a, b) => a - b)[0] || 0;
  const start = Math.max(0, first - 45);
  const excerpt = `${start ? '…' : ''}${source.slice(start, start + length)}${source.length > start + length ? '…' : ''}`;
  if (!terms.length) return [{text: excerpt, match: false}];
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(escaped.join('|'), 'gi');
  const runs = []; let cursor = 0;
  for (const match of excerpt.matchAll(pattern)) {
    if (match.index > cursor) runs.push({text: excerpt.slice(cursor, match.index), match: false});
    runs.push({text: match[0], match: true}); cursor = match.index + match[0].length;
  }
  if (cursor < excerpt.length) runs.push({text: excerpt.slice(cursor), match: false});
  return runs;
}
