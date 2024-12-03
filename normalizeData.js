const data = require("./cleanedData.json");

const maxGTI = Math.max(...data.map((item) => item.GTI));
const maxEnergy = Math.max(...data.map((item) => item.Energy));

const minGTI = Math.min(...data.map((item) => item.GTI));
const minEnergy = Math.min(...data.map((item) => item.Energy));

const normalizeValue = (value, min, max) => {
  return (value - min) / (max - min);
};

const getNormalizedData = (data) => {
  return data.map((item) => ({
    ...item,
    GTI: normalizeValue(item.GTI, minGTI, maxGTI),
    Energy: normalizeValue(item.Energy, minEnergy, maxEnergy),
  }));
};

const normalizedData = getNormalizedData(data);

// Saves the normalized data to a file
const fs = require("fs");
fs.writeFileSync(
  "normalizedData.json",
  JSON.stringify(normalizedData, null, 2)
);
console.log("Normalized data saved to normalizedData.json");
