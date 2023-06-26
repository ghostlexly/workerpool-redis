import cluster from "cluster";
import dayjs from "dayjs";
import { redisClient } from "./utils/redisClient";
import { availableQueues, queuesPool, Queue } from "./queue";

/** Jobs Worker */
// run the jobs worker only on the first cluster worker (to avoid multiple workers doing same jobs)
if (!cluster || !cluster.worker || cluster.worker.id === 1) {
  setInterval(async () => {
    // search for new jobs
    Object.entries(availableQueues).map(async ([key, queue]) => {
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
          if (
            jobData.status === "running" &&
            dayjs(jobData.startDate) < dayjs().subtract(queue.retryInMinutes, "minutes")
          ) {
            console.log(`The job [${key}] is staled, retrying...`);
            redisClient.set(key, JSON.stringify({ ...jobData, status: "pending" }));
          }

          // check if the job is already running
          if (jobData.status === "running") {
            continue;
          }

          // set the job status to running
          redisClient.set(key, JSON.stringify({ ...jobData, status: "running", startDate: dayjs() }));

          queuesPool.exec(queue.process, [...jobData.args]).then((result) => {
            console.log(`The job [${key}] is done, removing key...`);
            redisClient.del(key);

            // call the onComplete callback
            if (queue.onComplete) {
              queue.onComplete(result);
            }
          });
        } catch (err) {
          console.log(`An error occured while processing the job [${key}]...`, err);
          redisClient.del(key);
        }
      }
    });
  }, 500);
}

export { Queue, queuesPool, availableQueues, redisClient };
