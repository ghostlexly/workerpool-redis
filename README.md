# ✨ workerpool-redis ✨

Workerpool on steroids with Redis.
Queue persistence, automatic retry.

## Features

- 🐣 - Easy to use
- ♾️ - Retry queues automatically
- 📝 - Persist queues between restarts and crashes
- 💻 - Runs in the browser and on Node.js
- 💅 - Dynamically offloads functions to a worker
- 🔥 - Handles crashed workers
- ✅ - Module written in TypeScript

## Why

It can happen that our application restarts or crashes while jobs are in progress with workerpool.
This library allows for persistence so that these jobs are not lost and can be resumed.

## Install

Install via yarn:

```
yarn add workerpool-redis
```

## Configure Redis

Add the Redis environment variable.

#### If you have a password on your Redis:

```
// .env
REDIS_URL=redis://:password@localhost:6379
```

#### If you don't have a password on your Redis:

```
// .env
REDIS_URL=redis://localhost:6379
```

## Configure your queues

Create a queue named "testing".

```ts
import { Queue } from "workerpool-redis";

const testingQueue = new Queue("testing", (foo, arg2) => {
  // your code goes here

  console.log(foo); // will output "bar"

  return "ghostlexly";
});
```

## Add a job to your queue

Add a job:

```ts
testingQueue.add(["bar", "EDF-ARGUMENT2"]);
```

### async

If you want to wait for the result from the job:

```ts
const result = await test.add(["ABC-ARGUMENT1", "EDF-ARGUMENT2"]);
```

If you want to intercept the result:

```ts
test.add(["ABC-ARGUMENT1", "EDF-ARGUMENT2"]).then((result) => {
  // do something with the result
  console.log(result);
});
```
