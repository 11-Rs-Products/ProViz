/**
 * SemanticGraphBuilder.js
 * Incrementally builds and synchronizes the SemanticProgramGraph from source code,
 * ASTs, CFGs, SSAs, Call Graphs, Type Graphs, Heap Graphs, and Knowledge Graph artifacts.
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { SemanticRelationKind } from './SemanticRelationKind.js';
import { SemanticNode } from './SemanticNode.js';
import { SemanticEdge } from './SemanticEdge.js';
import { SemanticProgramGraph } from './SemanticProgramGraph.js';

export class SemanticGraphBuilder {
  constructor() {
    this._builderVersion = '1.0.0';
  }

  /**
   * Builds a SemanticProgramGraph from basic AST/Source descriptors.
   */
  buildFromSource(file, code, options = {}) {
    const graph = new SemanticProgramGraph();

    // 1. Module / File Node
    const fileId = `file:${file}`;
    graph.addNode(new SemanticNode({
      id: fileId,
      kind: SemanticEntityKind.FILE,
      name: file,
      sourceRange: { file, startLine: 1, startCol: 1, endLine: code ? code.split('\n').length : 1, endCol: 1 }
    }));

    if (options.functions) {
      for (const fn of options.functions) {
        const fnId = `fn:${file}:${fn.name}`;
        graph.addNode(new SemanticNode({
          id: fnId,
          kind: SemanticEntityKind.FUNCTION,
          name: fn.name,
          owningScope: fileId,
          sourceRange: fn.sourceRange || { file, startLine: fn.startLine || 1, startCol: 1, endLine: fn.endLine || 10, endCol: 1 },
          typeInfo: fn.typeInfo || { returnType: fn.returnType || 'any' }
        }));

        graph.addEdge(new SemanticEdge({
          id: `edge:${fileId}->declares->${fnId}`,
          sourceId: fileId,
          targetId: fnId,
          relation: SemanticRelationKind.DECLARES
        }));

        if (fn.calls) {
          for (const callee of fn.calls) {
            const calleeId = callee.id || `fn:${file}:${callee.name || callee}`;
            if (!graph.hasNode(calleeId)) {
              graph.addNode(new SemanticNode({
                id: calleeId,
                kind: SemanticEntityKind.FUNCTION,
                name: callee.name || callee,
                owningScope: fileId
              }));
            }
            graph.addEdge(new SemanticEdge({
              id: `edge:${fnId}->calls->${calleeId}`,
              sourceId: fnId,
              targetId: calleeId,
              relation: SemanticRelationKind.CALLS
            }));
          }
        }
      }
    }

    return graph;
  }

  /**
   * Integrates an AST into an existing or new graph.
   */
  integrateAST(ast, graph, file = 'unknown.js') {
    if (!ast) return graph;
    const fileId = `file:${file}`;
    if (!graph.hasNode(fileId)) {
      graph.addNode(new SemanticNode({
        id: fileId,
        kind: SemanticEntityKind.FILE,
        name: file
      }));
    }

    const traverse = (node, parentId) => {
      if (!node || typeof node !== 'object') return;
      const nodeId = node.id || `ast:${file}:${node.type || 'node'}_${Math.random().toString(36).substring(2, 8)}`;
      let kind = SemanticEntityKind.STATEMENT;
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') kind = SemanticEntityKind.FUNCTION;
      else if (node.type === 'ClassDeclaration') kind = SemanticEntityKind.CLASS;
      else if (node.type === 'VariableDeclaration') kind = SemanticEntityKind.VARIABLE;
      else if (node.type === 'CallExpression') kind = SemanticEntityKind.CALL_SITE;
      else if (node.type === 'IfStatement') kind = SemanticEntityKind.BRANCH;

      if (!graph.hasNode(nodeId)) {
        graph.addNode(new SemanticNode({
          id: nodeId,
          kind,
          name: node.name || node.id || node.type,
          owningScope: parentId,
          sourceRange: node.loc ? { file, ...node.loc } : null
        }));
      }

      if (parentId) {
        const edgeId = `edge:${parentId}->contains->${nodeId}`;
        if (!graph.getEdge(edgeId)) {
          graph.addEdge(new SemanticEdge({
            id: edgeId,
            sourceId: parentId,
            targetId: nodeId,
            relation: SemanticRelationKind.CONTAINS
          }));
        }
      }

      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'id' || key === 'type') continue;
        const val = node[key];
        if (Array.isArray(val)) {
          for (const child of val) traverse(child, nodeId);
        } else if (val && typeof val === 'object') {
          traverse(val, nodeId);
        }
      }
    };

    traverse(ast, fileId);
    return graph;
  }

  /**
   * Integrates CFG (Control Flow Graph) nodes into the semantic graph.
   */
  integrateCFG(cfg, graph, file = 'unknown.js') {
    if (!cfg || !cfg.nodes) return graph;

    for (const node of cfg.nodes) {
      const cfgId = node.id || `cfg:${file}:${node.index || 0}`;
      if (!graph.hasNode(cfgId)) {
        graph.addNode(new SemanticNode({
          id: cfgId,
          kind: node.kind || SemanticEntityKind.CONTROL_FLOW,
          name: node.label || `CFGNode_${node.id}`,
          cfgContext: { blockId: node.blockId, branchCondition: node.condition }
        }));
      }
    }

    if (cfg.edges) {
      for (const edge of cfg.edges) {
        const edgeId = `edge:${edge.from}->flows_to->${edge.to}`;
        if (!graph.getEdge(edgeId) && graph.hasNode(edge.from) && graph.hasNode(edge.to)) {
          graph.addEdge(new SemanticEdge({
            id: edgeId,
            sourceId: edge.from,
            targetId: edge.to,
            relation: SemanticRelationKind.FLOWS_TO,
            conditions: edge.condition ? { branch: edge.condition } : null
          }));
        }
      }
    }
    return graph;
  }

  /**
   * Integrates Knowledge Graph entities and edges (from Stage 28) into the Semantic Model.
   */
  integrateKnowledgeGraph(knowledgeGraph, semanticGraph) {
    if (!knowledgeGraph) return semanticGraph;

    const entities = knowledgeGraph.getEntities ? knowledgeGraph.getEntities() : (knowledgeGraph.getAllEntities ? knowledgeGraph.getAllEntities() : []);
    for (const entity of entities) {
      if (!semanticGraph.hasNode(entity.id)) {
        semanticGraph.addNode(new SemanticNode({
          id: entity.id,
          kind: entity.kind || SemanticEntityKind.EVIDENCE,
          name: entity.name || entity.id,
          sourceRange: entity.sourceLocation,
          provenanceRefs: entity.relatedArtifacts || [],
          attributes: { stage: entity.creationStage, fingerprint: entity.semanticFingerprint }
        }));
      }
    }

    const edges = knowledgeGraph.getEdges ? knowledgeGraph.getEdges() : (knowledgeGraph.getAllEdges ? knowledgeGraph.getAllEdges() : []);
    for (const edge of edges) {
      const source = edge.sourceId || edge.source;
      const target = edge.targetId || edge.target;
      if (source && target && semanticGraph.hasNode(source) && semanticGraph.hasNode(target)) {
        const edgeId = `edge:sync:${edge.id || `${source}->${edge.relation}->${target}`}`;
        if (!semanticGraph.getEdge(edgeId)) {
          semanticGraph.addEdge(new SemanticEdge({
            id: edgeId,
            sourceId: source,
            targetId: target,
            relation: edge.relation || SemanticRelationKind.DEPENDS_ON,
            confidence: edge.confidence || 1.0,
            provenance: edge.provenance || []
          }));
        }
      }
    }

    return semanticGraph;
  }
}
