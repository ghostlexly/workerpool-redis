import workerpool from "workerpool";
export declare const availableQueues: Queue[];
/**
 * Add Queues Mechanism (Workerpool)
 */
export declare const queuesPool: workerpool.WorkerPool;
export declare class Queue {
    name: string;
    process: (...args: any[]) => Promise<void>;
    retryInMinutes?: number;
    constructor(name: string, process: any, retryInMinutes?: number);
    add(args: [] | any[]): Promise<void>;
}
