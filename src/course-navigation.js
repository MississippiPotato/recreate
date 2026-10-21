// Old /code and /demo links now focus a region of the same shared workspace.
// Keep the former `tabs` query readable for existing shared URLs and history;
// the lecture and live canvas remain visible together regardless of focus.
export const panelTypes = ['explain', 'code', 'demo'];
export const sectionKey = id => `ch-${id.replace('.', '-')}`;
export const localId = (id, tab, name) => `${sectionKey(id)}-${tab}-${name}`;

export function readCourseRoute(url, curriculum) {
  const hash = url.hash.slice(1);
  const match = hash.match(/^ch-([1-5])-([1-8])(?:\/(explain|code|demo|step-[1-4]))?(?:\/([\w-]+))?$/);
  const lesson = Number(match?.[1] || hash.match(/^lesson-([1-5])$/)?.[1] ||
    (!hash && url.pathname.match(/lesson-0([1-5])\//)?.[1]) || 0);
  const course = curriculum.find(item => item.id === lesson);
  const section = course?.sections.find(item => item.id === `${lesson}.${match?.[2]}`) || course?.sections[0];
  const tab = ['code', 'demo'].includes(match?.[3]) ? match[3] : match?.[3] === 'step-2' ? 'demo' : 'explain';
  return {course, section, tab, anchor: match?.[4], explicit: !!match, page: hash};
}

export function readPanelState(url, course, remembered = new Map()) {
  const states = new Map(course.sections.map(section => [section.id, panelTypes.includes(remembered.get(section.id)) ? remembered.get(section.id) : 'explain']));
  if (url.searchParams.has('tabs')) {
    // An explicit URL is a complete snapshot for this chapter, including the
    // implicit explanation tabs. This also makes Back undo the first change.
    course.sections.forEach(section => states.set(section.id, 'explain'));
    for (const entry of url.searchParams.get('tabs').split(',')) {
      const [id, tab] = entry.split(':');
      if (states.has(id) && panelTypes.includes(tab)) states.set(id, tab);
    }
  }
  return states;
}

export function writePanelState(url, course, states) {
  const next = new URL(url);
  const entries = course.sections.filter(section => ['code','demo'].includes(states.get(section.id)))
    .map(section => `${section.id}:${states.get(section.id)}`);
  next.searchParams.set('tabs', entries.join(','));
  return next;
}

export function sectionHash(section, tab = 'explain', anchor = '') {
  return `#${sectionKey(section.id)}${tab === 'explain' && !anchor ? '' : '/' + tab}${anchor ? '/' + anchor : ''}`;
}
