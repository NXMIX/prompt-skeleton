declare module "@derhuerst/cli-on-key" {
  import stream = require("stream");

  namespace listen {
    interface Key {
      name?: string;
      ctrl: boolean;
      meta: boolean;
      shift: boolean;
      sequence: string;
      code?: string; // ansi code leaving out leading \x1b's
      raw: string;
    }

    interface Callback {
      (key: Key): void;
    }

    interface OffKeyPress {
      (): void;
    }
  }
  function listen(stream: stream.Readable, callback: listen.Callback): listen.OffKeyPress;
  export = listen;
}
