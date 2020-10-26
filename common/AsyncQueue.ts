class AsyncQueue {
  #calling = false;

  #waiting = new Array<() => void>();

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    // if already executing a call, wait in line
    // When a call is complete, the line advances
    if (this.#calling) {
      const wait = new Promise((resolve) => {
        this.#waiting.push(resolve);
      });
      await wait;
    }

    this.#calling = true;

    return fn().finally(() => {
      this.#calling = false;
      const release = this.#waiting.shift();
      release && release();
    });
  }
}

export default AsyncQueue;
