// public/data/costs.js
window.calculateCosts = function(districtName) {
  const district = window.districts[districtName];
  return {
    totalMonthly: district.maintenanceCost,
    totalOpening: district.openingCost
  };
};
