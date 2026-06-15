const getOrderStatus = require("./tools/getOrderStatus");

(async () => {
  const testIds = ["FLP1001", "FLP1006", "FLP1008", "FLP9999"];

  for (const id of testIds) {
    const result = await getOrderStatus(id);
    console.log(`\n--- ${id} ---`);
    console.log(JSON.stringify(result, null, 2));
  }
})();