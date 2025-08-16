module.exports = [
    {
        name: "Зона А",
        value: 10,
        coords: [
            [55.75, 37.60],
            [55.75, 37.70],
            [55.80, 37.70],
            [55.80, 37.60]
        ]
    },
    {
        name: "Зона B",
        value: 20,
        coords: [
            [55.70, 37.50],
            [55.70, 37.60],
            [55.75, 37.60],
            [55.75, 37.50]
        ]
    }
];

export function calculateCosts(districtName) {
  const district = districts[districtName];
  return {
    totalMonthly: district.maintenanceCost,
    totalOpening: district.openingCost
  };
}
