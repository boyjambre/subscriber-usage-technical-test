
function getTotalUsageMB(records) {
  return records.reduce((total, record) => {
    return total + record.dataUsageMB;
  }, 0);
}

// Pengujian Q4
const records = [
  { dataUsageMB: 1500 },
  { dataUsageMB: 1200 },
  { dataUsageMB: 500 }
];

console.log("Total penggunaan:", getTotalUsageMB(records), "MB");
console.log("Array kosong:", getTotalUsageMB([]), "MB");

module.exports = { getTotalUsageMB };
