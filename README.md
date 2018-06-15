# Overview
[![Build Status](https://travis-ci.org/NXMIX/prompt-skeleton.svg?branch=master)](https://travis-ci.org/NXMIX/prompt-skeleton)
[![Coverage Status](https://coveralls.io/repos/github/NXMIX/prompt-skeleton/badge.svg)](https://coveralls.io/github/NXMIX/prompt-skeleton)
[![npm](https://img.shields.io/npm/v/@nxmix/prompt-skeleton.svg?maxAge=1000)](https://www.npmjs.com/package/@nxmix/prompt-skeleton/)
[![Greenkeeper badge](https://badges.greenkeeper.io/NXMIX/prompt-skeleton.svg)](https://greenkeeper.io/)

This repo. is a rewrite of [prompt-skeleton](https://github.com/derhuerst/prompt-skeleton) in [typescript](https://www.typescriptlang.org). So the type definitions are "batteries-included".

## Usage

`npm i @nxmix/prompt-skeleton`

## Example

``` typescript
import wrap from "@nxmix/prompt-skeleton";

const prompt = wrap({
  value: 0,
  up: function() {
    this.value++;
    this.render();
  },
  down: function() {
    this.value--;
    this.render();
  },
  calls: 0,
  render: function() {
    this.out.write(`The value is ${this.value}. – ${this.calls++} calls`);
  }
});

prompt.then(console.log).catch(console.error);
```
