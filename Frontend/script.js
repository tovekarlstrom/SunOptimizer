import { fetchWeatherApi } from "openmeteo";
import { getNormalizedData } from "../normalizeData.js";
import model from "../AI-model/predictionModel.js";
import * as tf from "@tensorflow/tfjs";
import cleanData from "../cleanedData.json";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("predictionForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const date = document.getElementById("date").value;
    console.log("Selected date:", date);

    const params = {
      latitude: 52.52,
      longitude: 13.41,
      hourly: ["temperature_2m", "global_tilted_irradiance_instant"],
      tilt: 2,
      azimuth: 3,
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    // Helper function to form time ranges
    const range = (start, stop, step) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly();

    // Note: The order of weather variables in the URL query and the indices below need to match!
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
    // `weatherData` now contains a simple structure with arrays for datetime and weather data
    for (let i = 0; i < weatherData.hourly.time.length; i++) {
      rawData.push({
        time: weatherData.hourly.time[i].toISOString(),
        gti: weatherData.hourly.globalTiltedIrradianceInstant[i],
      });
    }
    const actualValues = [];
    for (const item of rawData) {
      const Gt = item.gti;
      const energy = A * Gt * eta * 1;
      actualValues.push({ energy });
    }
    const { normalizedData: normalizedActualValues } =
      getNormalizedData(actualValues);

    // console.log("ac", actualValues);
    const maxEnergy = Math.max(...cleanData.map((item) => item.energy));
    const minEnergy = Math.min(...cleanData.map((item) => item.energy));
    const { normalizedData } = getNormalizedData(rawData);
    // console.log("minEnergy", minEnergy);
    // console.log("maxEnergy", maxEnergy);
    // console.log("normalizedData", normalizedData);
    const modelData = normalizedData.map((item) => [
      item.time.hour,
      item.time.dayOfYear,
      item.gti,
    ]);
    // console.log("normalized", normalizedData);
    // console.log("raw", rawData);
    // console.log("model", modelData);

    // Skapa en tensor med rätt form
    const inputTensor = tf.tensor2d(modelData, [modelData.length, 3]);

    // Skicka den normaliserade datan till modellen för att göra förutsägelser
    const prediction = model.predict(inputTensor);
    const predictionArray = await prediction.array();
    // console.log("Prediction:", predictionArray);
    const rmse = Math.sqrt(
      predictionArray.reduce((sum, pred, i) => {
        return sum + Math.pow(pred[0] - normalizedActualValues[i].energy, 2);
      }, 0) / predictionArray.length
    );
    console.log("RMSE:", rmse);

    const denormalizeValue = (value, min, max) => {
      // console.log("value", value);
      // console.log("min", min);
      // console.log("max", max);
      return value * (max - min) + min;
    };

    const denormalizedPredictions = predictionArray.map((item) => ({
      energy: denormalizeValue(item[0], minEnergy, maxEnergy),
    }));
    const showData = [];
    for (let i = 0; i < denormalizedPredictions.length; i++) {
      showData.push({
        time: rawData[i].time,
        gti: rawData[i].gti,
        energy: denormalizedPredictions[i].energy,
      });
    }

    console.log("showData", showData);
    // denormalizedPredictions.forEach((item, index) => {
    //   console.log("item", item);
    //   console.log(`Prediction ${index + 1}: ${item.energy} kWh`);
    // });
  });
});
