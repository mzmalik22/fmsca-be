const { Record } = require("../models/Record");

const COLS_FOR_SEARCH = [
  "legal_name",
  "dba_name",
  "physical_address",
  "phone",
  "mc_mx_ff_number",
];

const COLS_FOR_FILTER = [
  "created_dt",
  "data_source_modified_dt",
  "entity_type",
  "operating_status",
  "legal_name",
  "dba_name",
  "physical_address",
  "phone",
  "usdot_number",
  "mc_mx_ff_number",
  "power_units",
  "out_of_service_date",
];

/**
 *
 * @param {*} query
 * @returns
 */
function getSearchStage(query) {
  if (!query) return;

  return {
    $match: {
      $or: COLS_FOR_SEARCH.map((col) => ({
        [col]: {
          $regex: query,
          $options: "i",
        },
      })),
    },
  };
}

/**
 *
 * @param {*} rawStartDate
 * @param {*} rawEndDate
 * @returns
 */
function getCreationStage(rawStartDate, rawEndDate) {
  if (!rawStartDate && !rawEndDate) return;

  const created_dt = {};

  if (rawStartDate) created_dt["$gte"] = new Date(rawStartDate);
  if (rawEndDate) {
    const endDate = new Date(rawEndDate);
    endDate.setDate(endDate.getDate() + 1);

    created_dt["$lte"] = endDate;
  }

  return { $match: { created_dt } };
}

/**
 *
 * @param {*} min
 * @param {*} max
 * @returns
 */
function getPowerUnitStage(min, max) {
  if (!min) return;
  if (!max) return;

  let minInt = parseInt(min);
  let maxInt = parseInt(max);

  if (isNaN(minInt)) return;
  if (isNaN(maxInt)) return;

  return {
    $match: {
      power_units: {
        $gte: minInt,
        $lte: maxInt,
      },
    },
  };
}

/**
 *
 * @param {*} fields
 * @returns
 */
function getFieldStage(fields) {
  if (!fields) return;

  const cols = fields.split(",").filter((field) => {
    if (COLS_FOR_FILTER.find((f) => f === field)) return true;
    return false;
  });

  const projection = { _id: 1 };

  if (cols && cols.length > 0) {
    cols.forEach((col) => (projection[col.trim()] = 1));
  } else {
    COLS_FOR_FILTER.forEach((col) => (projection[col.trim()] = 1));
  }

  return {
    $project: projection,
  };
}

/**
 *
 * @param {*} col
 * @param {*} type
 * @returns
 */
function getSortStage(col = "created_dt", type = "des") {
  return {
    $sort: {
      [col]: type === "asc" ? 1 : -1,
    },
  };
}

/**
 *
 * @param {*} page
 * @param {*} limit
 * @returns
 */
function getPaginationStages(page, limit) {
  let $page = parseInt(page);
  let $limit = parseInt(limit);

  if (isNaN($page)) $page = 1;
  if (isNaN($limit)) $limit = 20;

  const $skip = ($page - 1) * $limit;

  return [{ $skip }, { $limit }];
}

/**
 *
 * @param {*} pipeline
 * @returns
 */
function getPipeline(request) {
  // Search Stage
  const query = request.query.query;
  const searchStage = getSearchStage(query);

  // Creation Stage
  const creationFrom = request.query.from;
  const creationTo = request.query.to;
  const creationStage = getCreationStage(creationFrom, creationTo);

  // Power Units Stage
  const min = request.query.min;
  const max = request.query.max;
  const powerUnitStage = getPowerUnitStage(min, max);

  // Field Projection Stage
  const fields = request.query.fields;
  const fieldStage = getFieldStage(fields);

  // Sort Stage
  const sortColumn = request.query.sort;
  const sortType = request.query.sort_type;
  const sortStage = getSortStage(sortColumn, sortType);

  // Pagination Stage
  const page = request.query.page;
  const limit = request.query.limit;
  const paginationStages = getPaginationStages(page, limit);

  const stages = [
    searchStage,
    creationStage,
    powerUnitStage,
    fieldStage,
    sortStage,
  ].filter((stage) => !!stage);

  return [
    {
      $facet: {
        data: [...stages, ...paginationStages],
        total: [...stages, { $count: "count" }],
      },
    },
    {
      $project: {
        data: 1,
        total: { $arrayElemAt: ["$total.count", 0] },
      },
    },
  ];
}

class RecordsController {
  static async getAll(request, response) {
    try {
      const records = await Record.aggregate(getPipeline(request));
      return response.json({ success: true, ...records[0] });
    } catch (error) {
      console.log(error);
      return response.json({ success: false, error });
    }
  }
}

module.exports = RecordsController;
