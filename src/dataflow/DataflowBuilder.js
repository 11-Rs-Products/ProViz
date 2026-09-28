/**
 * DataflowBuilder — Assembles a DataflowGraph from normalized DataflowEvents.
 */

import { DataflowGraph } from './DataflowGraph.js';
import { DataflowNode, DATAFLOW_NODE_TYPES } from './DataflowNode.js';
import { DataflowEdge, DATAFLOW_EDGE_TYPES } from './DataflowEdge.js';
import { Definition } from './Definition.js';
import { Use } from './Use.js';
import { MutationRecord, MUTATION_OPERATIONS } from './MutationRecord.js';
import { DATAFLOW_EVENT_TYPES } from './DataflowEvent.js';
import { isReference } from '../runtime/Value.js';

export class DataflowBuilder {
    constructor() {
        this.graph = new DataflowGraph();
        // Tracks latest active definition for each variable: `scopeKey:varName` -> Definition
        this._latestDefs = new Map();
    }

    /**
     * Ingests an array of DataflowEvents into the graph.
     * @param {import('./DataflowEvent.js').DataflowEvent[]} events
     * @returns {DataflowGraph}
     */
    buildFromEvents(events = []) {
        for (const ev of events) {
            this.processEvent(ev);
        }
        return this.graph;
    }

    /**
     * Processes a single DataflowEvent.
     * @param {import('./DataflowEvent.js').DataflowEvent} ev
     */
    processEvent(ev) {
        const frameIndex = ev.frameIndex;
        const sourceLoc = ev.sourceLocation;
        const fileId = sourceLoc?.fileId || sourceLoc?.file || 'main.py';

        switch (ev.type) {
            case DATAFLOW_EVENT_TYPES.DEFINITION: {
                const varName = ev.subject.variable;
                const callFrameId = ev.subject.callFrameId || 'frame_0';
                const scopeKey = `${callFrameId}:${varName}`;

                // 1. Create or retrieve DataflowNode for this variable definition
                const varNode = DataflowNode.createVariableNode({
                    name: varName,
                    frameIndex,
                    fileId,
                    value: ev.value,
                    sourceLocation: sourceLoc,
                });
                this.graph.addNode(varNode);

                // 2. Create Definition record
                const def = new Definition({
                    variableName: varName,
                    targetType: 'variable',
                    value: ev.value,
                    sourceLocation: sourceLoc,
                    frameIndex,
                    callFrameId,
                    nodeId: varNode.id,
                    dependencies: ev.dependencies,
                    metadata: ev.metadata,
                });
                this.graph.addDefinition(def);

                // 3. Connect dependencies (DATA_DEPENDS_ON edges)
                for (const depVar of ev.dependencies) {
                    const depScopeKey = `${callFrameId}:${depVar}`;
                    const producerDef = this._latestDefs.get(depScopeKey) || this._latestDefs.get(`global:${depVar}`);

                    if (producerDef && producerDef.nodeId) {
                        this.graph.addEdge(new DataflowEdge({
                            type: DATAFLOW_EDGE_TYPES.DATA_DEPENDS_ON,
                            fromId: producerDef.nodeId,
                            toId: varNode.id,
                            sourceLocation: sourceLoc,
                            frameIndex,
                        }));
                    }
                }

                // If value is a heap reference, connect to Object node
                if (ev.value && isReference(ev.value) && ev.value.objectId) {
                    const objNode = DataflowNode.createObjectNode({
                        objectId: ev.value.objectId,
                        frameIndex,
                        sourceLocation: sourceLoc,
                    });
                    this.graph.addNode(objNode);

                    this.graph.addEdge(new DataflowEdge({
                        type: DATAFLOW_EDGE_TYPES.ALIASES,
                        fromId: varNode.id,
                        toId: objNode.id,
                        sourceLocation: sourceLoc,
                        frameIndex,
                    }));
                }

                this._latestDefs.set(scopeKey, def);
                break;
            }

            case DATAFLOW_EVENT_TYPES.USE: {
                const varName = ev.subject.variable;
                const callFrameId = ev.subject.callFrameId || 'frame_0';
                const scopeKey = `${callFrameId}:${varName}`;
                const producerDef = this._latestDefs.get(scopeKey) || this._latestDefs.get(`global:${varName}`);

                const useNode = new DataflowNode({
                    id: `df_use_${frameIndex}_${varName}`,
                    type: DATAFLOW_NODE_TYPES.VARIABLE,
                    label: `use(${varName})`,
                    variableId: varName,
                    frameIndex,
                    fileId,
                    sourceLocation: sourceLoc,
                    value: ev.value,
                });
                this.graph.addNode(useNode);

                const use = new Use({
                    variableName: varName,
                    value: ev.value,
                    sourceLocation: sourceLoc,
                    frameIndex,
                    callFrameId,
                    definitionId: producerDef?.id || null,
                    nodeId: useNode.id,
                });
                this.graph.addUse(use);

                if (producerDef && producerDef.nodeId) {
                    this.graph.addEdge(new DataflowEdge({
                        type: DATAFLOW_EDGE_TYPES.USES,
                        fromId: producerDef.nodeId,
                        toId: useNode.id,
                        sourceLocation: sourceLoc,
                        frameIndex,
                    }));
                }
                break;
            }

            case DATAFLOW_EVENT_TYPES.FIELD_WRITE: {
                const { objectId, fieldName, objectVar, dependencies = [] } = ev.subject;
                const fieldNode = DataflowNode.createFieldNode({
                    objectId: objectId || 'obj_unknown',
                    fieldName: fieldName || 'field',
                    frameIndex,
                    sourceLocation: sourceLoc,
                });
                this.graph.addNode(fieldNode);

                const mutation = new MutationRecord({
                    objectId: objectId || 'obj_unknown',
                    operation: MUTATION_OPERATIONS.FIELD_WRITE,
                    target: fieldName,
                    mutatorVariable: objectVar || null,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    nodeId: fieldNode.id,
                    metadata: ev.metadata,
                });
                this.graph.addMutation(mutation);

                if (objectId) {
                    const objNode = DataflowNode.createObjectNode({ objectId, frameIndex });
                    this.graph.addNode(objNode);
                    this.graph.addEdge(new DataflowEdge({
                        type: DATAFLOW_EDGE_TYPES.WRITES,
                        fromId: fieldNode.id,
                        toId: objNode.id,
                        frameIndex,
                    }));
                }
                break;
            }

            case DATAFLOW_EVENT_TYPES.ELEMENT_WRITE: {
                const { objectId, index, targetVar } = ev.subject;
                const elemNode = DataflowNode.createElementNode({
                    objectId: objectId || 'obj_unknown',
                    index: index || 0,
                    frameIndex,
                    sourceLocation: sourceLoc,
                });
                this.graph.addNode(elemNode);

                const mutation = new MutationRecord({
                    objectId: objectId || 'obj_unknown',
                    operation: MUTATION_OPERATIONS.REPLACE,
                    target: index,
                    mutatorVariable: targetVar || null,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    nodeId: elemNode.id,
                    metadata: ev.metadata,
                });
                this.graph.addMutation(mutation);
                break;
            }

            case DATAFLOW_EVENT_TYPES.OBJECT_MUTATION: {
                const objectId = ev.subject?.objectId || ev.metadata?.objectId || 'obj_unknown';
                const op = ev.metadata?.operation || MUTATION_OPERATIONS.CUSTOM_MUTATION;

                const mutNode = new DataflowNode({
                    id: `df_mut_node_${objectId}_${op}_f${frameIndex}`,
                    type: DATAFLOW_NODE_TYPES.STATEMENT,
                    label: `mutate ${objectId} (${op})`,
                    objectId,
                    frameIndex,
                    sourceLocation: sourceLoc,
                });
                this.graph.addNode(mutNode);

                const mutation = new MutationRecord({
                    objectId,
                    operation: op,
                    previousValue: ev.metadata?.previousValue,
                    nextValue: ev.metadata?.nextValue,
                    target: ev.metadata?.target,
                    mutatorVariable: ev.subject?.objectVar || null,
                    frameIndex,
                    sourceLocation: sourceLoc,
                    nodeId: mutNode.id,
                    metadata: ev.metadata,
                });
                this.graph.addMutation(mutation);

                const objNode = DataflowNode.createObjectNode({ objectId, frameIndex });
                this.graph.addNode(objNode);

                this.graph.addEdge(new DataflowEdge({
                    type: DATAFLOW_EDGE_TYPES.MUTATES,
                    fromId: mutNode.id,
                    toId: objNode.id,
                    frameIndex,
                }));
                break;
            }

            case DATAFLOW_EVENT_TYPES.ALIAS_CREATE: {
                const { objectId, variable, scopeId, fileId: aliasFileId } = ev.subject;
                if (objectId && variable) {
                    this.graph.addAlias(objectId, variable, frameIndex, scopeId || 'local', aliasFileId || fileId);
                }
                break;
            }

            default:
                break;
        }
    }
}
