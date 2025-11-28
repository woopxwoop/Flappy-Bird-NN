/*
copy paste all the code from learning2.js for it to work
(or switch src in index.html to learning2)
*/

//this is a constructor i promise i know it doesn't look like it
function neuron() {
  this.weights = [];

  this.predict = (input) => {
    while (this.weights.length <= input.length) {
      // init random weights + 1 bias
      this.weights.push(Math.random() * 2 - 1);
    }

    let sum = 0;

    // add weights * inputs
    for (let i = 0; i < input.length; i++) {
      sum += this.weights[i] * input[i];
    }

    sum += this.weights[this.weights.length - 1]; // add bias

    if (sum > 0) {
      return sum;
    } else {
      return 0;
    }
  };
}

//yet another confusing constructor (🔥🔥🔥🔥)
function layer(numNeurons) {
  this.neurons = [];

  for (let i = 0; i < numNeurons; i++) {
    this.neurons.push(new neuron());
  }

  this.predict = (input) => {
    let output = [];

    for (let neuron of this.neurons) {
      output.push(neuron.predict(input));
    }

    return output;
  };
}

//the whole network! (⚡️⚡️⚡️ constructor)(using ⚡️ instead of 🔥 to save the environment)
function net() {
  this.layers = [];

  this.init = () => {
    this.layers.push(new layer(3));
    this.layers.push(new layer(3));
    this.layers.push(new layer(1));
  };

  this.predict = (input) => {
    for (let layer of this.layers) {
      input = layer.predict(input);
    }

    return input[0] > 0; // will flap if > 0
  };

  this.init();
}

/*–
this is not a constructor, just a function which
creates a mutated copy of another neural net (ideally a parent)
(⚡️⚡️⚡️⚡️)
*/
function mutate(parentNet, mutationRate, rebelRate) {
  let mutation = new net();

  for (let i = 0; i < parentNet.layers.length; i++) {
    for (let j = 0; j < parentNet.layers[i].neurons.length; j++) {
      if (Math.random() <= rebelRate) {
        for (
          let k = 0;
          k < parentNet.layers[i].neurons[j].weights.length;
          k++
        ) {
          mutation.layers[i].neurons[j].weights[k] = Math.random() * 2 - 1;
        }
      } else {
        for (
          let k = 0;
          k < parentNet.layers[i].neurons[j].weights.length;
          k++
        ) {
          if (Math.random() <= mutationRate) {
            mutation.layers[i].neurons[j].weights[k] = Math.random() * 2 - 1;
          } else {
            mutation.layers[i].neurons[j].weights[k] =
              parentNet.layers[i].neurons[j].weights[k];
          }
        }
      }
    }
  }
  return mutation;
}
