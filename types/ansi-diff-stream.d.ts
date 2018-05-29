// Type definitions for ansi-diff-stream v 2.0
// Project: https://github.com/mafintosh/ansi-diff-stream
// Definitions by: Rong Shen <https://github.com/jacobbubu>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="node" />

declare module "ansi-diff-stream" {
  import stream = require("stream");

  namespace differ {
    export interface DiffStream extends stream.Transform {
      reset(): void;
      clear(): void;
    }
  }

  function differ(): differ.DiffStream;
  export = differ;
}
