function generateMermaidCode(databaseData, jsonData) {
  let mermaidCode = "";

  // Create a mapping of column names to data types
  const columnDataTypes = {};
  for (const key in jsonData.metadata) {
    const tableData = jsonData.metadata[key];
    for (const column of tableData) {
      columnDataTypes[column.column_name] = column.data_type;
    }
  }

  const relationshipMap = {};

  for (const row of databaseData) {
    const {
      TABLE_NAME,
      COLUMN_NAME,
      REF_TABLE_NAME,
      REF_COLUMN_NAME,
    } = row;

    // Determine the relationship type based on column data types
    const columnType = columnDataTypes[COLUMN_NAME];
    const refColumnType = columnDataTypes[REF_COLUMN_NAME];

    const relationshipKey = `${TABLE_NAME}-${REF_TABLE_NAME}`;
    if (relationshipMap[relationshipKey]) {
      relationshipMap[relationshipKey].push({
        column: COLUMN_NAME,
        refColumn: REF_COLUMN_NAME,
        columnType,
        refColumnType,
      });
    } else {
      relationshipMap[relationshipKey] = [
        {
          column: COLUMN_NAME,
          refColumn: REF_COLUMN_NAME,
          columnType,
          refColumnType,
        },
      ];
    }
  }

  for (const key in relationshipMap) {
    const [first] = relationshipMap[key];
    const { column, refColumn, columnType, refColumnType } = first;
    let relationshipType = "--"; // Default to many-to-many

    if (columnType === refColumnType) {
      relationshipType = "--"; // one-to-one
    } else if (
      (columnType === "int" || columnType === "bigint") &&
      (refColumnType === "int" || refColumnType === "bigint")
    ) {
      relationshipType = "-->"; // many-to-many
    }

    const [TABLE_NAME, REF_TABLE_NAME] = key.split("-");
    mermaidCode += `
      ${TABLE_NAME} ${relationshipType} ${REF_TABLE_NAME} : "${column} - ${refColumn}"
    `;
  }

  return mermaidCode;
}

// Sample database data and metadata
const databaseData = [
  {
    TABLE_NAME: "accident",
    COLUMN_NAME: "ReportNumber",
    REF_TABLE_NAME: "participants",
    REF_COLUMN_NAME: "ReportNumber",
  },
  {
    TABLE_NAME: "car",
    COLUMN_NAME: "License",
    REF_TABLE_NAME: "owns",
    REF_COLUMN_NAME: "License",
  },
  {
    TABLE_NAME: "person",
    COLUMN_NAME: "DriverID",
    REF_TABLE_NAME: "participants",
    REF_COLUMN_NAME: "DriverID",
  },
  {
    TABLE_NAME: "participants",
    COLUMN_NAME: "License",
    REF_TABLE_NAME: "owns",
    REF_COLUMN_NAME: "License",
  },
  {
    TABLE_NAME: "person",
    COLUMN_NAME: "DriverID",
    REF_TABLE_NAME: "accident",
    REF_COLUMN_NAME: "DriverID",
  },
];

const jsonData = {
  "metadata": {
    "accident": [
      {
        "column_name": "ReportNumber",
        "data_type": "int",
        "column_key": "PRI"
      }
    ],
    "car": [
      {
        "column_name": "License",
        "data_type": "varchar",
        "column_key": "PRI"
      }
    ],
    "person": [
      {
        "column_name": "DriverID",
        "data_type": "int",
        "column_key": "PRI"
      }
    ],
    "participants": [
      {
        "column_name": "License",
        "data_type": "varchar",
        "column_key": "PRI"
      }
    ]
  }
};

const mermaidCode = generateMermaidCode(databaseData, jsonData);

console.log(mermaidCode);
