import fs from "fs";
import { generateScenarios } from "./generateScenarios.js";
import { fetchWeatherData } from "./getHistoricalWeatherData.js";

const getModelData = async () => {
  let data = [];
  const scenarios = generateScenarios();
  console.log("generate", scenarios.length);
  for (let index = 0; index < scenarios.length; index++) {
    const scenario = scenarios[index];
    try {
      const weatherData = await fetchWeatherData(scenario);
      data = data.concat(weatherData);
    } catch (error) {
      console.error("Error fetching weather data", error);
    }
  }

  fs.writeFileSync("cleanedData.json", JSON.stringify(data, null, 2));
  console.log("Cleaned data saved to cleanedData.json");
};

getModelData();
