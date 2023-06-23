import workerpool from "workerpool";
declare const availableQueues: Queue[];
/**
 * Add Queues Mechanism (Workerpool)
 */
declare const queuesPool: workerpool.WorkerPool;
declare class Queue {
    name: string;
    process: (...args: any[]) => Promise<void>;
    retryInMinutes?: number;
    constructor(name: string, process: any, retryInMinutes?: number);
    add(args: [] | any[]): Promise<void>;
}
export { Queue, queuesPool, availableQueues };
