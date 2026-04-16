export interface WikiPageNode {
  id: string;
  title: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  parentId?: string;
}

export interface WikiSectionNode {
  id: string;
  title: string;
  pages: string[];
  subsections?: string[];
}

export interface WikiStructureNode {
  id: string;
  title: string;
  description: string;
  pages: WikiPageNode[];
  sections?: WikiSectionNode[];
  rootSections?: string[];
}

interface CategoryRule {
  id: string;
  title: string;
  keywords: string[];
  pathPrefixes: string[];
  order: number;
}

interface Subgroup {
  id: string;
  title: string;
  pages: WikiPageNode[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    id: 'overview',
    title: 'Overview',
    keywords: ['overview', 'introduction', 'readme', 'summary', 'getting started'],
    pathPrefixes: ['readme', 'docs', 'documentation'],
    order: 0,
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    keywords: ['architecture', 'system', 'design', 'workflow', 'orchestration', 'routing'],
    pathPrefixes: ['src/app', 'src/utils', 'src/hooks'],
    order: 1,
  },
  {
    id: 'frontend',
    title: 'Frontend',
    keywords: ['frontend', 'ui', 'interface', 'page', 'component', 'view', 'layout'],
    pathPrefixes: ['src/app', 'src/components', 'public'],
    order: 2,
  },
  {
    id: 'backend',
    title: 'Backend',
    keywords: ['backend', 'api', 'server', 'service', 'websocket', 'endpoint'],
    pathPrefixes: ['api', 'src/app/api'],
    order: 3,
  },
  {
    id: 'data',
    title: 'Data Flow',
    keywords: ['data', 'storage', 'cache', 'index', 'retrieval', 'pipeline'],
    pathPrefixes: ['api/config', 'api/tools', 'src/utils'],
    order: 4,
  },
  {
    id: 'models',
    title: 'Model Integration',
    keywords: ['model', 'llm', 'ai', 'embedding', 'openai', 'ollama', 'bedrock', 'azure'],
    pathPrefixes: ['api/openai', 'api/ollama', 'api/azure', 'api/bedrock', 'api/dashscope'],
    order: 5,
  },
  {
    id: 'infrastructure',
    title: 'Deployment & Infrastructure',
    keywords: ['deployment', 'docker', 'build', 'infrastructure', 'config', 'environment'],
    pathPrefixes: ['docker', '.github', 'scripts', 'next.config', 'package', 'tailwind.config'],
    order: 6,
  },
  {
    id: 'quality',
    title: 'Tooling & Quality',
    keywords: ['test', 'quality', 'lint', 'tooling', 'workflow', 'ci'],
    pathPrefixes: ['tests', 'test', '.github/workflows'],
    order: 7,
  },
];

const FOLDER_LABELS = new Map<string, string>([
  ['src/app', 'App Pages'],
  ['src/components', 'UI Components'],
  ['src/contexts', 'Contexts'],
  ['src/hooks', 'Hooks'],
  ['src/utils', 'Utilities'],
  ['src/messages', 'Localization'],
  ['src/app/api', 'Route Handlers'],
  ['api/config', 'Configuration'],
  ['api/tools', 'Tooling'],
  ['api', 'Backend Services'],
  ['public', 'Public Assets'],
  ['scripts', 'Automation Scripts'],
  ['tests', 'Integration & Unit Tests'],
  ['test', 'Tests'],
  ['docs', 'Documentation'],
  ['readme', 'Documentation'],
]);

const SECTION_ID_SANITIZER = /[^a-z0-9]+/g;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function titleCase(value: string): string {
  return value
    .split(/[/_-]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function sanitizeSectionId(value: string): string {
  return normalizeText(value)
    .replace(SECTION_ID_SANITIZER, '-')
    .replace(/^-+|-+$/g, '') || 'group';
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
}

function getMeaningfulFolder(filePath: string): string | null {
  const normalized = normalizePath(filePath);

  if (!normalized) {
    return null;
  }

  if (normalized === 'readme.md' || normalized.startsWith('docs/')) {
    return 'readme';
  }

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments.length === 1) {
    const fileName = segments[0];
    if (fileName.startsWith('dockerfile') || fileName.includes('compose')) {
      return 'docker';
    }
    if (fileName.startsWith('package') || fileName.includes('config')) {
      return fileName.replace(/\.[^.]+$/, '');
    }
    return null;
  }

  const first = segments[0];
  const second = segments[1];

  if (first === 'src' && second === 'app' && segments.length >= 3 && segments[2] === 'api') {
    return 'src/app/api';
  }

  if ((first === 'src' || first === 'api') && second) {
    return `${first}/${second}`;
  }

  return first;
}

function scoreCategory(page: WikiPageNode, category: CategoryRule): number {
  const title = normalizeText(page.title);
  const paths = page.filePaths.map(normalizePath);

  let score = 0;

  for (const keyword of category.keywords) {
    if (title.includes(keyword)) {
      score += 4;
    }
  }

  for (const path of paths) {
    for (const prefix of category.pathPrefixes) {
      if (path.startsWith(prefix)) {
        score += 3;
      }
    }
  }

  if (category.id === 'overview' && page.filePaths.some(path => normalizePath(path) === 'readme.md')) {
    score += 8;
  }

  return score;
}

function getCategoryForPage(page: WikiPageNode): CategoryRule {
  let bestCategory = CATEGORY_RULES[0];
  let bestScore = -1;

  for (const category of CATEGORY_RULES) {
    const score = scoreCategory(page, category);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (bestScore <= 0) {
    const dominantFolder = getDominantFolderKey(page.filePaths);
    if (dominantFolder?.startsWith('api')) {
      return CATEGORY_RULES.find(category => category.id === 'backend') ?? bestCategory;
    }
    if (dominantFolder?.startsWith('src/components') || dominantFolder?.startsWith('src/app')) {
      return CATEGORY_RULES.find(category => category.id === 'frontend') ?? bestCategory;
    }
    if (dominantFolder?.startsWith('tests') || dominantFolder?.startsWith('test')) {
      return CATEGORY_RULES.find(category => category.id === 'quality') ?? bestCategory;
    }
  }

  return bestCategory;
}

function getDominantFolderKey(filePaths: string[]): string | null {
  const folderScore = new Map<string, number>();

  for (const filePath of filePaths) {
    const folder = getMeaningfulFolder(filePath);
    if (!folder) {
      continue;
    }
    folderScore.set(folder, (folderScore.get(folder) ?? 0) + 1);
  }

  if (folderScore.size === 0) {
    return null;
  }

  return [...folderScore.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function getSubgroupForPage(page: WikiPageNode, categoryId: string): { id: string; title: string } | null {
  const folderKey = getDominantFolderKey(page.filePaths);

  if (folderKey) {
    const label = FOLDER_LABELS.get(folderKey) ?? titleCase(folderKey);
    return {
      id: sanitizeSectionId(folderKey),
      title: label,
    };
  }

  const title = normalizeText(page.title);

  if (categoryId === 'architecture') {
    if (title.includes('flow') || title.includes('pipeline')) {
      return { id: 'flows', title: 'Flows & Pipelines' };
    }
    if (title.includes('state') || title.includes('lifecycle')) {
      return { id: 'state', title: 'Lifecycle & State' };
    }
  }

  if (categoryId === 'infrastructure') {
    if (title.includes('config')) {
      return { id: 'configuration', title: 'Configuration' };
    }
    if (title.includes('deploy') || title.includes('docker')) {
      return { id: 'deployment', title: 'Deployment' };
    }
  }

  return null;
}

function sortPages(pages: WikiPageNode[]): WikiPageNode[] {
  const importanceOrder = { high: 0, medium: 1, low: 2 };

  return [...pages].sort((left, right) => {
    const importanceDelta = importanceOrder[left.importance] - importanceOrder[right.importance];
    if (importanceDelta !== 0) {
      return importanceDelta;
    }
    return left.title.localeCompare(right.title);
  });
}

function buildHierarchicalSections(pages: WikiPageNode[]): { sections: WikiSectionNode[]; rootSections: string[] } {
  const sections: WikiSectionNode[] = [];
  const rootSections: string[] = [];
  const pagesByCategory = new Map<string, WikiPageNode[]>();

  for (const page of pages) {
    const category = getCategoryForPage(page);
    const categoryPages = pagesByCategory.get(category.id) ?? [];
    categoryPages.push(page);
    pagesByCategory.set(category.id, categoryPages);
  }

  const orderedCategories = CATEGORY_RULES
    .filter(category => (pagesByCategory.get(category.id) ?? []).length > 0)
    .sort((left, right) => left.order - right.order);

  for (const category of orderedCategories) {
    const categoryPages = sortPages(pagesByCategory.get(category.id) ?? []);
    const subgroupMap = new Map<string, Subgroup>();

    for (const page of categoryPages) {
      const subgroup = getSubgroupForPage(page, category.id);
      if (!subgroup) {
        continue;
      }

      const existingGroup = subgroupMap.get(subgroup.id);
      if (existingGroup) {
        existingGroup.pages.push(page);
      } else {
        subgroupMap.set(subgroup.id, {
          ...subgroup,
          pages: [page],
        });
      }
    }

    const sectionId = `section-${category.id}`;
    const subsections = [...subgroupMap.values()]
      .filter(group => group.pages.length >= 2)
      .sort((left, right) => right.pages.length - left.pages.length || left.title.localeCompare(right.title));

    const shouldNestSubsections =
      subsections.length >= 2 ||
      (subsections.length >= 1 && categoryPages.length >= 5);

    if (!shouldNestSubsections) {
      sections.push({
        id: sectionId,
        title: category.title,
        pages: categoryPages.map(page => page.id),
      });
      rootSections.push(sectionId);
      continue;
    }

    const nestedSectionIds: string[] = [];
    const nestedPageIds = new Set<string>();

    for (const group of subsections) {
      const subsectionId = `${sectionId}-${group.id}`;
      sections.push({
        id: subsectionId,
        title: group.title,
        pages: sortPages(group.pages).map(page => page.id),
      });
      nestedSectionIds.push(subsectionId);
      group.pages.forEach(page => nestedPageIds.add(page.id));
    }

    const directPages = categoryPages
      .filter(page => !nestedPageIds.has(page.id))
      .map(page => page.id);

    sections.push({
      id: sectionId,
      title: category.title,
      pages: directPages,
      subsections: nestedSectionIds.length > 0 ? nestedSectionIds : undefined,
    });
    rootSections.push(sectionId);
  }

  return { sections, rootSections };
}

function shouldRegroupStructure(structure: WikiStructureNode): boolean {
  const pages = structure.pages ?? [];
  const sections = structure.sections ?? [];
  const rootSections = structure.rootSections ?? [];

  if (pages.length === 0) {
    return false;
  }

  if (sections.length === 0 || rootSections.length === 0) {
    return true;
  }

  const rootSectionMap = new Map(sections.map(section => [section.id, section]));
  const rootNodes = rootSections
    .map(sectionId => rootSectionMap.get(sectionId))
    .filter((section): section is WikiSectionNode => Boolean(section));

  if (rootNodes.length === 0) {
    return true;
  }

  const hasNestedSections = rootNodes.some(section => (section.subsections?.length ?? 0) > 0);
  const averagePagesPerRoot = pages.length / rootNodes.length;
  const largestFlatSection = rootNodes.reduce((max, section) => Math.max(max, section.pages.length), 0);

  if (!hasNestedSections && pages.length >= 8) {
    return true;
  }

  if (averagePagesPerRoot > 3.5) {
    return true;
  }

  if (largestFlatSection >= 5) {
    return true;
  }

  return false;
}

export function normalizeWikiStructure<T extends WikiStructureNode>(structure: T): T {
  const normalizedStructure = {
    ...structure,
    sections: structure.sections ?? [],
    rootSections: structure.rootSections ?? [],
  };

  if (!shouldRegroupStructure(normalizedStructure)) {
    return normalizedStructure as T;
  }

  const { sections, rootSections } = buildHierarchicalSections(normalizedStructure.pages ?? []);

  return {
    ...normalizedStructure,
    sections,
    rootSections,
  } as T;
}
