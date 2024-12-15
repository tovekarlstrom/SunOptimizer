import { getNormalizedData } from "../normalizeData.js";
import model from "./predictionModel.js";
import * as tf from "@tensorflow/tfjs";
import { fetchWeatherData } from "../getHistoricalWeatherData.js";
import { generateScenarios } from "../generateScenarios.js";

const A = 10; // Area of the solar panel
const eta = 0.18; // Efficiency of the solar panel

const testNewData = async () => {
  const scenarios = generateScenarios();

  let newData = [];

  for (const scenario of scenarios) {
    const weatherData = await fetchWeatherData(scenario);
    newData = newData.concat(weatherData);
  }
  const { normalizedData } = getNormalizedData(newData);
  const newTestData = normalizedData.map((item) => [
    item.time.hour,
    item.time.dayOfYear,
    item.gti,
  ]);
  const newTestDataTensor = tf.tensor2d(newTestData);
  const newPredictions = model.predict(newTestDataTensor);
  const newPredictionsArray = await newPredictions.array();

  console.log("New Predictions:", newPredictionsArray);

  const actualValues = [];
  for (const item of newData) {
    const Gt = item.gti;
    const energy = A * Gt * eta * 1;
    actualValues.push({ energy });
  }
  console.log("ac", actualValues);
  const { normalizedData: normalizedActualValues } =
    getNormalizedData(actualValues);
  console.log("Normalized Actual Values:", normalizedActualValues.length);
  console.log("Normalized Predictions:", newPredictionsArray.length);

  console.log("newPredictionsArray:", newPredictionsArray);
  console.log("normalizedActualValues:", normalizedActualValues);
  console.log("hej");
  // Beräkna RMSE för de nya prediktionerna
  const rmse = Math.sqrt(
    newPredictionsArray.reduce((sum, pred, i) => {
      return sum + Math.pow(pred[0] - normalizedActualValues[i].energy, 2);
    }, 0) / newPredictionsArray.length
  );

  console.log("New Data RMSE:", rmse);
};
