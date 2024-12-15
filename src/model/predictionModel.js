import * as tf from "@tensorflow/tfjs";
import getNormalizedData from "../components/normalizeData.js";
import data from "../components/cleanedData.json";
// Shuffle the data
const { normalizedData } = getNormalizedData(data);
const shuffledData = normalizedData.sort(() => Math.random() - 0.5);

// Split the data into training and testing sets
const totalData = shuffledData.length;
const splitIndex = Math.floor(totalData * 0.8);
const trainingData = shuffledData
  .slice(0, splitIndex)
  .map((item) => [item.time.hour, item.time.dayOfYear, item.gti]);

const trainingLabels = shuffledData
  .slice(0, splitIndex)
  .map((item) => [item.energy]);

const testData = shuffledData
  .slice(splitIndex)
  .map((item) => [item.time.hour, item.time.dayOfYear, item.gti]);
const testLabels = shuffledData.slice(splitIndex).map((item) => [item.energy]);
//byt namn från lables till output
const trainingDataTensor = tf.tensor2d(trainingData);
const trainingOutputTensor = tf.tensor2d(trainingLabels);

const testDataTensor = tf.tensor2d(testData);
const testLabelsTensor = tf.tensor2d(testLabels);

const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, activation: "relu", inputShape: [3] }));
model.add(tf.layers.dense({ units: 1 }));
model.compile({
  optimizer: tf.train.adam(),
  loss: "meanSquaredError",
});

export const trainModel = async () => {
  await model.fit(trainingDataTensor, trainingOutputTensor, {
    epochs: 500,
    batchSize: 32,
    validationSplit: 0.2,
  });
  // Evaluate the model
  const result = model.evaluate(testDataTensor, testLabelsTensor);
  result.print();

  // Make a prediction
  const predictions = model.predict(testDataTensor);
  predictions.print();

  // Convert predictions to array and log them
  const predictionsArray = await predictions.array();
  console.log("Predictions:", predictionsArray);

  // Compare predictions with actual values
  const actualValues = await testLabelsTensor.array();
  console.log("Actual Values:", actualValues);
  // Calculate Mean Absolute Error (MAE)
  const mae =
    predictionsArray.reduce((sum, pred, i) => {
      return sum + Math.abs(pred[0] - actualValues[i][0]);
    }, 0) / predictionsArray.length;
  console.log("Mean Absolute Error (MAE):", mae);

  // Calculate Root Mean Squared Error (RMSE)
  const rmse = Math.sqrt(
    predictionsArray.reduce((sum, pred, i) => {
      return sum + Math.pow(pred[0] - actualValues[i][0], 2);
    }, 0) / predictionsArray.length
  );
  console.log("Root Mean Squared Error (RMSE):", rmse);
};

export default model;
