import wrap from "../src";

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

prompt.then(console.log.bind(console, "Submitted:")).catch(console.error.bind(console, "Aborted:"));
