const { Record } = require("../models/Record");

const xlsx = require("node-xlsx").default;

const REQUIRED_COLUMNS = {
  created_dt: 1,
  data_source_modified_dt: 1,
  entity_type: 1,
  operating_status: 1,
  legal_name: 1,
  dba_name: 1,
  physical_address: 1,
  phone: 1,
  usdot_number: 1,
  mc_mx_ff_number: 1,
  power_units: 1,
  out_of_service_date: 1,
};

function getAggregate() {
  const sheets = xlsx.parse(`${__dirname}/../${process.env.FMSCA_RECORD_PATH}`);
  const [columnNames, ...rows] = sheets[0].data;

  let cols = { ...REQUIRED_COLUMNS };

  columnNames.forEach((name, index) => {
    if (Object.keys(REQUIRED_COLUMNS).indexOf(name) !== -1) cols[name] = index;
  });

  const aggregate = [];

  rows.forEach((rawData) => {
    const data = { ...REQUIRED_COLUMNS };

    data.phone = rawData[cols.phone];
    data.dba_name = rawData[cols.dba_name];
    data.legal_name = rawData[cols.legal_name];
    data.power_units = rawData[cols.power_units];
    data.entity_type = rawData[cols.entity_type];
    data.usdot_number = rawData[cols.usdot_number];
    data.created_dt = new Date(rawData[cols.created_dt]);
    data.mc_mx_ff_number = rawData[cols.mc_mx_ff_number];
    data.operating_status = rawData[cols.operating_status];
    data.physical_address = rawData[cols.physical_address];
    data.out_of_service_date = rawData[cols.out_of_service_date];
    data.data_source_modified_dt = new Date(
      rawData[cols.data_source_modified_dt]
    );

    aggregate.push({ insertOne: { document: data } });
  });

  return aggregate;
}

/**
 * Refreshes the data in the records collection
 * - Parses the data from the sheet
 * - Deletes the existing data
 * - Bulk writes the parsed data to the db
 */
exports.parseRecords = async () => {
  try {
    console.log("Starting Seeder for FMSCA Records from XLSX sheet");

    // Get the parsed data from the sheet
    const aggregate = getAggregate();
    // Delete the existing records
    await Record.deleteMany({}).catch(console.error);
    // Bulk write the parsed data to db
    await Record.bulkWrite(aggregate);
  } catch (err) {
    console.error("Seeding FMSCA Records Failed", err);
  }
};
