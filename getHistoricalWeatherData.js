import { fetchWeatherApi } from "openmeteo";

export const fetchWeatherData = async (scenario) => {
  const params = {
    latitude: 58.41488839788278,
    longitude: 13.835380630207675,
    start_date: scenario.start_date,
    end_date: scenario.end_date,
    hourly: "global_tilted_irradiance_instant",
    tilt: 15,
    azimuth: 90, // east
  };

  const url = "https://historical-forecast-api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);

  if (!responses || responses.length === 0) {
    console.error("No responses received from the API");
    return null;
  }

  const response = responses[0];

  if (!response) {
    console.error("No response data available");
    return null;
  }

  // Check if the response contains an error message
  if (response.error) {
    console.error("API Error:", response.error);
    return null;
  }

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const hourly = response.hourly();

  if (!hourly) {
    console.error("Hourly data is null or undefined");
    return null;
  }

  const weatherData = {
    hourly: {
      time: range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      globalTiltedIrradianceInstant: hourly.variables(0).valuesArray(),
    },
  };

  // Prepare data for machine learning
  const mlData = [];
  const A = 10; // Area of the solar panel
  const eta = 0.18; // Efficiency of the solar panel
  for (let i = 0; i < weatherData.hourly.time.length; i++) {
    const Gt = weatherData.hourly.globalTiltedIrradianceInstant[i];
    if (Gt === undefined || Gt === null) {
      console.warn(
        `Filling missing data for hour ${weatherData.hourly.time[
          i
        ].toISOString()} with 0`
      );
      mlData.push({
        time: weatherData.hourly.time[i].toISOString(),
        gti: 0,
        energy: A * 0 * eta * 1,
      });
    } else {
      mlData.push({
        time: weatherData.hourly.time[i].toISOString(),
        gti: Gt,
        energy: A * Gt * eta * 1,
      });
    }
  }

  return mlData;
};

// Helper function to form time ranges
const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
