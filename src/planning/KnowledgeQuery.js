export class KnowledgeQuery {
  constructor(knowledgeBase = null) {
    this.knowledgeBase = knowledgeBase;
  }

  findFacts(subject) {
    return KnowledgeQuery.findFacts(this.knowledgeBase, subject);
  }

  findConflicts(subject) {
    return KnowledgeQuery.findConflicts(this.knowledgeBase, subject);
  }

  static findFacts(knowledgeBase, subject) {
    if (!knowledgeBase) return [];
    return knowledgeBase.getFactsForSubject(subject);
  }

  static findConflicts(knowledgeBase, subject) {
    if (!knowledgeBase) return [];
    const facts = knowledgeBase.getFactsForSubject(subject);
    const conflicts = [];
    for (let i = 0; i < facts.length; i++) {
      for (let j = i + 1; j < facts.length; j++) {
        if (facts[i].fact !== facts[j].fact && facts[i].confidence > 0.5 && facts[j].confidence > 0.5) {
          conflicts.push({ factA: facts[i], factB: facts[j] });
        }
      }
    }
    return conflicts;
  }
}
