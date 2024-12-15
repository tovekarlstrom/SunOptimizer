export default function getNormalizedData(data) {
  const maxGTI = Math.max(...data.map((item) => item.gti));
  const minGTI = Math.min(...data.map((item) => item.gti));

  const maxEnergy = Math.max(...data.map((item) => item.energy));
  const minEnergy = Math.min(...data.map((item) => item.energy));

  const normalizeValue = (value, min, max) => {
    return (value - min) / (max - min);
  };

  const normalizeTime = (time) => {
    const date = new Date(time);
    const hour = date.getUTCHours();
    const dayOfYear = Math.floor(
      (date - new Date(date.getUTCFullYear(), 0, 0)) / 86400000
    );
    return {
      hour: normalizeValue(hour, 0, 23),
      dayOfYear: normalizeValue(dayOfYear, 0, 365),
    };
  };

  const normalizedData = data.map((item) => ({
    time: normalizeTime(item.time),
    gti: normalizeValue(item.gti, minGTI, maxGTI),
    energy: normalizeValue(item.energy, minEnergy, maxEnergy),
  }));

  return { normalizedData, minGTI, maxGTI, minEnergy, maxEnergy };
}
