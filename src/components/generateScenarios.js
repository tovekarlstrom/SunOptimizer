export const generateScenarios = () => {
  const dates = [
    { start: "2023-03-21", end: "2023-03-22" }, // Vårdagjämning
    { start: "2023-06-21", end: "2023-06-22" }, // Sommarsolstånd
    { start: "2023-09-23", end: "2023-09-24" }, // Höstdagjämning
    { start: "2023-12-21", end: "2023-12-22" }, // Vintersolstånd
  ];

  const scenarios = [];

  for (const date of dates) {
    scenarios.push({
      start_date: date.start,
      end_date: date.end,
    });
  }

  return scenarios;
};
