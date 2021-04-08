const _ = require("lodash");
const moment = require("moment");

/**
 * Groups array of objects by a grouping parameter and converts key to the form "devicename-parametername"
 * @param {object[]} response - timestream response as array of objects
 * @param {object} deviceDictionary - object with device names grouped by device ids
 * @param {string} groupBy - grouping parameter(any key from response)
 * @returns {object} object grouped by grouping parameter and with key names as "devicename-parametername"
 */
const group_by_key = (response, deviceDictionary, groupBy) => {
  response = _.chain(response)
    .groupBy(groupBy)
    .map((v, i) => {
      let obj = {};
      obj[groupBy] = i;
      obj = {
        ...obj,
        ...v.reduce((acc, current) => {
          acc[
            `${deviceDictionary[current.deviceId].name}-${current.measure_name}`
          ] = getParsedValue(
            current["measure_value::double"],
            current["dataType"]
          );
          return acc;
        }, {}),
      };
      return obj;
    })
    .value();

  return response;
};

/**
 * Computes energy consumption of devices grouped by grouping parameter
 * @param {string[]} deviceIds - array of device ids
 * @param {object[]} responseForPastData - timestream response of past data as object with deviceIds as keys.
 * @param {object[]} main_response - timestream response of current duration as array of objects
 * @param {object} deviceDictionary - object with device names grouped by device ids
 * @param {string} groupBy - grouping parameter
 * @returns {object[]} array of objects with each object consisting of time and energy consumed per device parameter
 */
const generateEnergyReport = async (
  deviceIds,
  responseForPastData,
  main_response,
  deviceDictionary,
  groupBy
) => {
  let main_response_final = groupByTime(
    main_response,
    deviceDictionary,
    groupBy
  );

  main_response_final = main_response_final.map((groupData, index) => {
    // filter keys and sort them based on frontend requirement
    const groupDataKeys = Object.keys(groupData)
      .filter(
        (key) =>
          key != "time" &&
          key.indexOf("-max") == -1 &&
          key.indexOf("-min") == -1
      )
      .sort();

    //  we need time as first key, so we initialise
    const calculatedGroupData = { time: groupData["time"] };

    //energy consumed calculation
    groupDataKeys.map((measureNameKey) => {
      deviceIds.map((deviceId) => {
        const deviceName_string = deviceDictionary[deviceId].name.toString();
        //check presence of device id or device name in current key
        if (
          measureNameKey.indexOf(deviceId) !== -1 ||
          measureNameKey.indexOf(deviceName_string) !== -1
        ) {
          const max = _.get(groupData, `${measureNameKey}-max`) * 1;
          let min = 0;
          //check if the current index is last index(oldest time group)
          if (index === main_response_final.length - 1) {
            //get max energy of data before start time to be used as min energy for oldest time group
            min = getPastMaxEnergy(
              groupData,
              responseForPastData,
              measureNameKey,
              deviceId
            );
          } else {
            min =
              _.get(
                main_response_final,
                `${index + 1}.${measureNameKey}-max`,
                _.get(groupData, `${measureNameKey}-min`)
              ) * 1;
          }
          calculatedGroupData[measureNameKey] = (max - min).toFixed(2);
        }
      });
    });

    return calculatedGroupData;
  });

  return main_response_final;
};

const groupByTime = (response, deviceDictionary, groupBy) => {
  // https://jsfiddle.net/mahbub/qx4tajL6/
  response = _.chain(response)
    .groupBy(groupBy)
    .map(function (v, i) {
      return {
        // local time
        time: moment(i).format("yyyy-MM-DD HH:mm:ss"),
        ...v.reduce((acc, current) => {
          const deviceName = deviceDictionary[current.deviceId].name;

          if (deviceName) {
            acc[`${deviceName}-${current.measure_name}-min`] = current.min * 1;
            acc[`${deviceName}-${current.measure_name}-max`] = current.max * 1;
            // initialise now and will be calculated later
            acc[`${deviceName}-${current.measure_name}`] = 0;
          } else {
            acc[`${current.deviceId}-${current.measure_name}-min`] =
              current.min * 1;
            acc[`${current.deviceId}-${current.measure_name}-max`] =
              current.max * 1;
            // initialise now and will be calculated later
            acc[`${current.deviceId}-${current.measure_name}`] = 0;
          }
          return acc;
        }, {}),
      };
    })
    .value();
  return response;
};

const getPastMaxEnergy = (
  groupData,
  responseForPastData,
  measureNameKey,
  deviceId
) => {
  let min = 0;
  if (Object.keys(responseForPastData).length === 0) {
    //use min energy of current time group as minimum
    min = _.get(groupData, `${measureNameKey}-min`) * 1;
  } else {
    for (let k = 0; k < responseForPastData[deviceId].length; k++) {
      const measureData = responseForPastData[deviceId][k];
      //check presence of measure name in current key
      if (measureNameKey.indexOf(measureData["measure_name"]) !== -1) {
        //use max energy of data before start time as minimum
        min = measureData["measure_value::double"] * 1;
        break;
      }
    }
  }
  return min;
};

const keyValueTransformation = (response) => {
  response = response.map((data) => {
    data = data.substring(1, data.length - 1);
    let temp = data.split(",").reduce((acc, current) => {
      const keyValue = current.split("=");
      if (keyValue.length === 2) {
        if (keyValue[0].trim() == "time") {
          // to group by using time
          acc[keyValue[0].trim()] = moment(keyValue[1].trim())
            .add(5.5, "hours")
            .format("YYYY-MM-DD HH:mm:ss");
        } else {
          acc[keyValue[0].trim()] = keyValue[1].trim();
        }
      }
      return acc;
    }, {});
    return temp;
  });
  return response;
};

/**
 * Parses result of timestream read query and converts it into key value pairs of column name and row value
 * @param {object} response - timestream read response as object
 * @returns {object[]} array of objects with each object corresponding to a row
 */
const parseQueryResult = (response) => {
  let result = [];
  result = response.Rows.map((row) => {
    let rowObj = {};
    let i;
    for (i = 0; i < row.Data.length; i++) {
      rowObj[response.ColumnInfo[i].Name] = row.Data[i].ScalarValue;
    }

    return rowObj;
  });

  return result;
};

/**
 * Parses result of timestream read query based on column type and converts it into key value pairs of column name and row value
 * @param {object} response - timestream read response as object
 * @returns {object[]} array of objects with each object corresponding to a row
 */
const parseQueryResultWithProcessing = (response) => {
  const columnInfo = response.ColumnInfo;
  const rows = response.Rows;

  let data = rows.map((row) => {
    return parseRow(columnInfo, row);
  });

  data = keyValueTransformation(data);

  return data;
};

const parseRow = (columnInfo, row) => {
  const data = row.Data;

  const rowOutput = data.map((element, index) => {
    return parseDatum(columnInfo[index], element);
  });
  return `{${rowOutput.join(", ")}}`;
};

const parseDatum = (info, datum) => {
  if (datum.NullValue != null && datum.NullValue === true) {
    return `${info.Name}=NULL`;
  }

  const columnType = info.Type;

  // If the column is of TimeSeries Type
  if (columnType.TimeSeriesMeasureValueColumnInfo != null) {
    return parseTimeSeries(info, datum);
  }
  // If the column is of Array Type
  else if (columnType.ArrayColumnInfo != null) {
    const arrayValues = datum.ArrayValue;
    return `${info.Name}=${parseArray(info.Type.ArrayColumnInfo, arrayValues)}`;
  }
  // If the column is of Row Type
  else if (columnType.RowColumnInfo != null) {
    const rowColumnInfo = info.Type.RowColumnInfo;
    const rowValues = datum.RowValue;
    return parseRow(rowColumnInfo, rowValues);
  }
  // If the column is of Scalar Type
  else {
    return parseScalarType(info, datum);
  }
};

const parseTimeSeries = (info, datum) => {
  const timeSeriesOutput = [];
  datum.TimeSeriesValue.map((dataPoint) => {
    timeSeriesOutput.push(
      `{time=${dataPoint.Time}, value=${parseDatum(
        info.Type.TimeSeriesMeasureValueColumnInfo,
        dataPoint.Value
      )}}`
    );
  });

  return `[${timeSeriesOutput.join(", ")}]`;
};

const parseScalarType = (info, datum) => {
  return parseColumnName(info) + datum.ScalarValue;
};

const parseColumnName = (info) => {
  return info.Name == null ? "" : `${info.Name}=`;
};

const parseArray = (arrayColumnInfo, arrayValues) => {
  const arrayOutput = [];
  arrayValues.map((datum) => {
    arrayOutput.push(parseDatum(arrayColumnInfo, datum));
  });
  return `[${arrayOutput.join(", ")}]`;
};

/**
 * Converts string value from timestream column to its corresponding data type
 * @param {string} value - value as a string
 * @param {string} type - name of data type of value as a string
 * @returns {*} value converted to a particular type
 */
const getParsedValue = (value, type) => {
  let parsedValue;
  switch (type) {
    case "BOOL":
      if (value === "true") {
        parsedValue = true;
      } else if (value === "false") {
        parsedValue = false;
      }
    case "FLOAT":
    case "REAL":
    case "LREAL":
      parsedValue = parseFloat(value);
      break;
    case "DATE":
      parsedValue = moment(parseFloat(value)).format("YYYY-MM-DD");
      break;
    case "TOD":
      parsedValue = moment(parseInt(value) * 1000)
        .utc()
        .format("HH:mm:ss");
      break;
    case "TIME":
      parsedValue = moment(parseInt(value) / 1000)
        .utc()
        .format("HH:mm:ss");
      break;
    case "INT":
    case "UINT":
    case "USINT":
    case "UDINT":
    case "SINT":
    case "DINT":
    case "WORD":
    case "DWORD":
      parsedValue = parseInt(value);
      break;
    default:
      parsedValue = 0;
  }
  return parsedValue;
};

/**
 *@module timestream_processing
 */
module.exports = {
  generateEnergyReport,
  parseQueryResultWithProcessing,
  parseQueryResult,
  getParsedValue,
  groupByKey: group_by_key,
};
