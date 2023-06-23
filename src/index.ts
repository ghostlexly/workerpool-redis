import workerpool from "workerpool";
import { createClient } from "redis";
import crypto from "crypto";
import cluster from "cluster";
import dayjs from "dayjs";

const queues: Queue[] = [];

/** Load Redis */
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.log("[Redis] - error: ", err);
});

redisClient.connect();

/**
 * Add Queues Mechanism (Workerpool)
 */
export const pool = workerpool.pool({
  maxWorkers: require("os").cpus().length,
});

export class Queue {
  name: string;
  process: (...args: any[]) => Promise<void>;

  constructor(name: string, process: any) {
    this.name = name;
    this.process = process;

    // add this to the queues array
    queues[name] = this;
  }

  async add(args: [] | any[]) {
    redisClient.set(`jobs:${this.name}:${crypto.randomUUID()}`, JSON.stringify({ status: "pending", args: args }));
  }
}

/** Jobs Worker */
// run the jobs worker only on the first cluster worker (to avoid multiple workers doing same jobs)
if (cluster.worker.id === 1) {
  setInterval(async () => {
    // search for new jobs
    Object.entries(queues).map(async ([key, queue]) => {
      for await (const key of redisClient.scanIterator({ MATCH: `jobs:${queue.name}:*`, COUNT: 1000 })) {
        try {
          const cache: string = await redisClient.get(key);

          // check if cache is not null
          if (!cache) {
            continue;
          }

          // parse the job data
          const jobData = JSON.parse(cache);

          // retry staled jobs
          if (jobData.status === "running" && dayjs(jobData.startDate) < dayjs().subtract(5, "minutes")) {
            console.log(`The job [${key}] is staled, retrying...`);
            redisClient.set(key, JSON.stringify({ ...jobData, status: "pending" }));
          }

          // check if the job is already running
          if (jobData.status === "running") {
            continue;
          }

          // set the job status to running
          redisClient.set(key, JSON.stringify({ ...jobData, status: "running", startDate: dayjs() }));

          pool.exec(queue.process, [...jobData.args]).then(() => {
            console.log(`The job [${key}] is done, removing key...`);
            redisClient.del(key);
          });
        } catch (err) {
          console.log(`An error occured while processing the job [${key}]...`, err);
          redisClient.del(key);
        }
      }
    });
  }, 500);
}
