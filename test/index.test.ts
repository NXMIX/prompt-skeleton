// Native
import { Transform } from "stream";
import { EventEmitter } from "events";

// Packages
import through = require("through2");
import prettyAnsi from "@nxmix/readable-ansi";
import * as esc from "ansi-escapes";

import wrap, { Options } from "../src";

process.setMaxListeners(100);

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

interface TestStream extends Transform {
  isRaw: boolean;
  setRawMode(mode: boolean): void;
}

const hasExpectedContent = (stream, expected, tr?: (raw: string) => string) => {
  tr = tr || (x => x);

  return new Promise(resolve => {
    let result = "";
    stream.on("data", function(chunk) {
      result += chunk.toString();
      if (tr(result).indexOf(expected) >= 0) {
        resolve();
      }
    });
  });
};

const hasNoContent = (stream, timeout = 10) => {
  return new Promise((resolve, reject) => {
    let result = "";
    stream.on("data", function(chunk) {
      result += chunk.toString();
    });
    setTimeout(() => {
      result ? reject(result) : resolve(result);
    }, timeout);
  });
};

describe("prompt-skeleton", () => {
  let stdin;
  let stdout;

  const testKeysTable = [
    ["up", "\u001b[A"],
    ["down", "\u001b[B"],
    ["right", "\u001b[C"],
    ["left", "\u001b[D"],
    ["next", "\t"],
    ["first", "\u0001"],
    ["last", "\u0005"],
    ["reset", "\u0007"],
    ["abort", "\u0003"],
    ["abort", "\u0004"],
    ["abort", "\u001b"],
    ["submit", "\r"],
    ["submit", "\n"],
    ["delete", "\x7f"],
    ["delete", "\u001b[3~"],
    ["_", "a"]
  ];
  beforeEach(() => {
    stdin = through(function(chunk, enc, cb) {
      this.push(chunk);
      cb();
    }) as TestStream;

    stdin.isRaw = true;
    stdin.setRawMode = function(mode: boolean) {
      this.isRaw = mode;
    };

    stdout = through(function(chunk, enc, cb) {
      this.push(chunk);
      cb();
    }) as TestStream;

    Object.assign(stdout, require("events"));

    stdout.isRaw = true;
    stdout.setRawMode = function(mode: boolean) {
      this.isRaw = mode;
    };
  });

  afterEach(() => {
    stdin.end();
    stdout.end();
  });

  describe("key to actions", () => {
    (it as any).each(testKeysTable)("action %s", (actionName, keySeq) => {
      const fn = jest.fn().mockName(actionName);
      const param: Options = {
        stdin,
        stdout
      };
      param[actionName] = fn;
      wrap(param);
      stdin.write(keySeq);
      expect(fn).toBeCalled();
    });
  });

  describe("submit/abort", () => {
    it("submit", () => {
      const param: Options = {
        stdin,
        _: function(c: string) {
          this.value = (this.value || "") + c;
        }
      };
      const prompt = wrap(param);
      stdin.write("abc\n");
      expect(prompt).resolves.toBe("abc");
    });

    it("abort", () => {
      const param: Options = {
        stdin,
        _: function(c: string) {
          this.value = this.value + c;
        }
      };
      const prompt = wrap(param);
      stdin.write("abc\u001b");
      return expect(prompt).rejects.toBe("abc");
    });
  });

  describe("custom render", () => {
    it("renderer", () => {
      const param: Options = {
        stdin,
        stdout,
        _: function(c: string) {
          this.value = this.value + c;
          this.render();
        },
        render: function() {
          this.out.write(this.value);
        }
      };
      wrap(param);
      stdin.write("abc");
      const expected = "(I̷)(￩¹⁰⁰⁰)a\n(￪¹)(￩¹⁰⁰⁰)(￫¹)b(⨯→)\n(￪¹)(￩¹⁰⁰⁰)(￫²)c(⨯→)\n";

      return hasExpectedContent(stdout, expected, prettyAnsi);
    });
  });

  describe("misc.", () => {
    it("resize", () => {
      const fn = jest.fn().mockName("render");
      const param: Options = {
        stdin,
        stdout,
        render: fn
      };
      wrap(param);
      (stdout as EventEmitter).emit("resize");
      expect(fn).toBeCalledWith(true);
    });

    it("bell", () => {
      const param: Options = {
        stdin,
        stdout
      };
      wrap(param);
      const expected = esc.beep;
      param.bell();

      return hasExpectedContent(stdout, expected);
    });

    it("unhandled action", () => {
      const param: Options = {
        stdin,
        stdout
      };
      wrap(param);
      const expected = esc.beep;
      stdin.write(esc.cursorUp(1));

      return hasExpectedContent(stdout, expected);
    });

    it("hide cursor", () => {
      const param: Options = {
        stdin,
        stdout,
        hideCursor: false
      };
      wrap(param);
      return hasNoContent(stdout);
    });
  });
});
