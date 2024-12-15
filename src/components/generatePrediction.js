import { fetchWeatherApi } from "openmeteo";
import * as tf from "@tensorflow/tfjs";
import getNormalizedData from "./normalizeData";
import model from "../model/predictionModel";
export default async function generatePrediction(date) {
  const params = {
    latitude: 52.52,
    longitude: 13.41,
    hourly: ["temperature_2m", "global_tilted_irradiance_instant"],
    tilt: 2,
    azimuth: 3,
  };
  const url = "https://api.open-meteo.com/v1/forecast";
  try {
    const responses = await fetchWeatherApi(url, params);

    // Helper function to form time ranges
    const range = (start, stop, step) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly();

    const weatherData = {
      hourly: {
        time: range(
          Number(hourly.time()),
          Number(hourly.timeEnd()),
          hourly.interval()
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        temperature2m: hourly.variables(0).valuesArray(),
        globalTiltedIrradianceInstant: hourly.variables(1).valuesArray(),
      },
    };
    const rawData = [];

    for (let i = 0; i < weatherData.hourly.time.length; i++) {
      rawData.push({
        time: weatherData.hourly.time[i].toISOString(),
        gti: weatherData.hourly.globalTiltedIrradianceInstant[i],
      });
    }

    const actualValues = [];
    const A = 10;
    const eta = 0.18;
    for (const item of rawData) {
      const Gt = item.gti;
      const energy = A * Gt * eta * 1;
      actualValues.push({ energy });
    }
    const { normalizedData: normalizedActualValues } =
      getNormalizedData(actualValues);

    const { normalizedData } = getNormalizedData(rawData);

    const modelData = normalizedData.map((item) => [
      item.time.hour,
      item.time.dayOfYear,
      item.gti,
    ]);

    const inputTensor = tf.tensor2d(modelData);

    const prediction = model.predict(inputTensor);
    const predictionArray = await prediction.array();
    console.log("Prediction:", predictionArray);
    const rmse = Math.sqrt(
      predictionArray.reduce((sum, pred, i) => {
        return sum + Math.pow(pred[0] - normalizedActualValues[i].energy, 2);
      }, 0) / predictionArray.length
    );
    console.log("RMSE:", rmse);

    const showData = [];

    for (let i = 0; i < rawData.length; i++) {
      showData.push({
        time: rawData[i].time,
        prediction: rawData[i].gti === 0 ? 0 : predictionArray[i][0],
      });
    }

    console.log("showData", showData);
    return showData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}
