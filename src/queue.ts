import workerpool from "workerpool";
import { redisClient } from "@/utils/redisClient";

export const availableQueues: Queue[] = [];

/**
 * Add Queues Mechanism (Workerpool)
 */
export const queuesPool = workerpool.pool({
  maxWorkers: require("os").cpus().length,
});

export class Queue {
  name: string;
  process: (...args: any[]) => Promise<void>;
  retryInMinutes?: number = 5;

  constructor(name: string, process: any, retryInMinutes?: number) {
    this.name = name;
    this.process = process;

    if (retryInMinutes) {
      this.retryInMinutes = retryInMinutes;
    }

    // add this to the available queues array
    availableQueues[name] = this;
  }

  async add(args: [] | any[]) {
    redisClient.set(`jobs:${this.name}:${crypto.randomUUID()}`, JSON.stringify({ status: "pending", args: args }));
  }
}