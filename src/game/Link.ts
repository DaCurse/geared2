/**
 * Link.ts
 * Represents a pipe connection between machines or to global storage.
 * Pipes provide tiered throughput rate limits.
 */

import { Machine } from './Machine';
import type { PipeDefinition } from './Pipe';
import { Storage } from './Storage';

export interface LinkData {
  id: string;
  fromId: string;
  toId: string;
  resource: string;
  pipeType: string; // pipe definition ID
}

export type LinkEndpoint = Machine | Storage;

export class Link {
  id: string;
  fromId: string;
  toId: string;
  resource: string;
  pipeDefinition: PipeDefinition;

  constructor(
    id: string,
    fromId: string,
    toId: string,
    resource: string,
    pipeDef: PipeDefinition
  ) {
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
    this.resource = resource;
    this.pipeDefinition = pipeDef;
  }

  /**
   * Get the throughput rate of this pipe.
   */
  getThroughput(): number {
    return this.pipeDefinition.throughput;
  }

  /**
   * Upgrade this pipe to a new definition.
   */
  upgradePipe(newPipeDef: PipeDefinition): void {
    this.pipeDefinition = newPipeDef;
  }

  /**
   * Transfer resources from source to target through the pipe.
   * Resources transfer directly, limited by pipe throughput.
   * @param worldObjects - Map of all machines and storage by ID
   * @param dt - Delta time in seconds
   */
  transfer(worldObjects: Map<string, LinkEndpoint>, dt: number): void {
    const source = worldObjects.get(this.fromId);
    const target = worldObjects.get(this.toId);

    if (!source || !target) {
      console.warn(`Link ${this.id}: Missing source or target`);
      return;
    }

    // Calculate maximum transfer based on pipe throughput
    const maxTransfer = this.pipeDefinition.throughput * dt;

    // Get available amount from source
    let available = 0;
    if (source instanceof Machine) {
      available = source.getOutput(this.resource);
    } else if (source instanceof Storage) {
      available = source.get(this.resource);
    }

    // Get available space in target
    let targetSpace = Infinity;
    if (target instanceof Machine) {
      const current = target.getInput(this.resource);
      targetSpace = target.bufferCapacity - current;
    } else if (target instanceof Storage) {
      targetSpace = target.getFreeSpace(this.resource);
    }

    // Calculate actual transfer amount (limited by source, target, and pipe)
    const toTransfer = Math.min(available, targetSpace, maxTransfer);

    if (toTransfer <= 0) return;

    // Remove from source
    let removed = 0;
    if (source instanceof Machine) {
      removed = source.removeOutput(this.resource, toTransfer);
    } else if (source instanceof Storage) {
      removed = source.remove(this.resource, toTransfer);
    }

    // Add to target
    if (target instanceof Machine) {
      target.addInput(this.resource, removed);
    } else if (target instanceof Storage) {
      target.add(this.resource, removed);
    }
  }

  /**
   * Serialize to JSON-compatible object.
   */
  serialize(): LinkData {
    return {
      id: this.id,
      fromId: this.fromId,
      toId: this.toId,
      resource: this.resource,
      pipeType: this.pipeDefinition.id,
    };
  }

  /**
   * Deserialize from saved data.
   */
  static deserialize(data: LinkData, pipeDef: PipeDefinition): Link {
    return new Link(data.id, data.fromId, data.toId, data.resource, pipeDef);
  }
}
