import workerpool from "workerpool";
import { redisClient } from "./utils/redisClient";
import crypto from "crypto";

const availableQueues: Queue[] = [];

/**
 * Add Queues Mechanism (Workerpool)
 */
const queuesPool = workerpool.pool({
  maxWorkers: require("os").cpus().length,
});

class Queue {
  name: string;
  process: (...args: any[]) => any;
  onComplete?: (result: any) => any;
  retryInMinutes?: number = 5;

  constructor(
    name: string,
    process: (...args: any[]) => any,
    { onComplete, retryInMinutes }: { onComplete?: (result: any) => any; retryInMinutes?: number } = {}
  ) {
    this.name = name;
    this.process = process;
    this.onComplete = onComplete;
    this.retryInMinutes = retryInMinutes;

    // add this to the available queues array
    availableQueues[name] = this;
  }

  async add(args: [] | any[]) {
    redisClient.set(`jobs:${this.name}:${crypto.randomUUID()}`, JSON.stringify({ status: "pending", args: args }));
  }
}

export { Queue, queuesPool, availableQueues };
