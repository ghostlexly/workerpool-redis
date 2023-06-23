import workerpool from "workerpool";
declare const availableQueues: Queue[];
/**
 * Add Queues Mechanism (Workerpool)
 */
declare const queuesPool: workerpool.WorkerPool;
declare class Queue {
    name: string;
    process: (...args: any[]) => any;
    onComplete?: (result: any) => any;
    retryInMinutes?: number;
    constructor(name: string, process: (...args: any[]) => any, { onComplete, retryInMinutes }?: {
        onComplete?: (result: any) => any;
        retryInMinutes?: number;
    });
    add(args: [] | any[]): Promise<void>;
}
export { Queue, queuesPool, availableQueues };
