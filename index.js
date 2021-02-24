const _ = require("lodash");
const moment = require("moment");

const { connectToDatabase } = require("./dbconnect");
const { ObjectID } = require("mongodb");

const normalReport = async (AWS, mongo_url, db_name, body) => {
  let flag = 0;
  body.devices.every((device) => {
    let params = device["measure_name"];
    if (params.length === 0) {
      flag++;
      return false;
    } else {
      params.every((param) => {
        if (param.length === 0) {
          flag++;
          return false;
        } else {
          return true;
        }
      });
      return true;
    }
  });

  if (flag !== 0) {
    throw new Error("Parameters of any device cannot be empty");
  }

  AWS.config.update({
    region: "us-east-1",
  });

  let deviceIds_string = body.devices.map((d) => `'${d.deviceId}'`);
  let measure_names = _.flattenDeep(body.devices.map((d) => d.measure_name));
  measure_names_string = measure_names.map((m) => `'${m}'`);
  measure_names_string = _.uniq(measure_names_string);

  const devIds = body.devices.map((d) => new ObjectID(d.deviceId));
  const findObject = {
    page: 1,
    limit: 10,
    fields: { parameters: 0 },
    filter: { _id: { $in: devIds } },
    sort: {
      _id: -1,
    },
  };

  const data = await findDevice(findObject, mongo_url, db_name);

  if (data.length < 1) {
    throw new Error("device not found");
  }

  const deviceDictionary = _.keyBy(data, "_id");

  const start = moment(body.startDate);
  const end = moment(body.endDate);

  if (start && end) {
    const diff = moment.duration(end.diff(start));
    const days = diff.asDays();
    if (days < 1) {
      if (deviceIds_string.length == 1) {
        query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
          ","
        )}) and measure_name IN (${measure_names_string.join(
          ","
        )}) and time <= '${moment(body.endDate).format(
          "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
        )}' and time >= '${moment(body.startDate).format(
          "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
        )}' ORDER BY ${body.sort}`;
      } else {
        query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
          ","
        )}) and measure_name IN (${measure_names_string.join(
          ","
        )}) and FM = 'true' and time <= '${moment(body.endDate).format(
          "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
        )}' and time >= '${moment(body.startDate).format(
          "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
        )}' ORDER BY ${body.sort}`;
      }
    } else if (days >= 1 && days < 15) {
      query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
        ","
      )}) and measure_name IN (${measure_names_string.join(
        ","
      )}) and H = 'true' and time <='${moment(body.endDate).format(
        "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
      )}' and time >= '${moment(body.startDate).format(
        "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
      )}' ORDER BY ${body.sort}`;
    } else {
      query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
        ","
      )}) and measure_name IN (${measure_names_string.join(
        ","
      )}) and D = 'true' and time <= '${moment(body.endDate).format(
        "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
      )}' and time >= '${moment(body.startDate).format(
        "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
      )}' ORDER BY ${body.sort}`;
    }
  } else if (body.lastRecordLength) {
    query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
      ","
    )}) and measure_name IN (${measure_names_string.join(",")}) ORDER BY ${
      body.sort
    } LIMIT ${body.lastRecordLength}`;
  } else if (body.ago) {
    query = `SELECT * FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
      ","
    )}) and measure_name IN (${measure_names_string.join(
      ","
    )}) and time >= ago(${body.ago}) ORDER BY ${body.sort}`;
  }
  let res = await readRecords(AWS, query, null, []);

  res = keyValueTransformation(res);

  // grouping according to time
  res = _.chain(res)
    .groupBy("time")
    .map((v, i) => {
      return {
        time: i,
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
    })
    .value();

  return res;
};
const findDevice = async (findObject, mongo_url, db_name) => {
  const skip = findObject.page * findObject.limit - findObject.limit;

  const db = await connectToDatabase(mongo_url, db_name);
  const data = await db
    .collection("devices")
    .find(findObject.filter, findObject.fields)
    .sort(findObject.sort)
    .skip(skip)
    .limit(findObject.limit)
    .toArray();

  return data;
};

const energyReport = async (AWS, mongo_url, db_name, body) => {
  let flag = 0;
  body.devices.every((device) => {
    let params = device["measure_name"];
    if (params.length === 0) {
      flag++;
      return false;
    } else {
      params.every((param) => {
        if (param.length === 0) {
          flag++;
          return false;
        } else {
          return true;
        }
      });
      return true;
    }
  });

  if (flag !== 0) {
    throw new Error("Parameters of any device cannot be empty");
  }
  AWS.config.update({
    region: "us-east-1",
  });

  let deviceIds_string = body.devices.map((d) => `'${d.deviceId}'`);
  let measure_names = _.flattenDeep(body.devices.map((d) => d.measure_name));
  measure_names_string = measure_names.map((m) => `'${m}'`);
  measure_names_string = _.uniq(measure_names_string);
  let groupBy;
  if (body.groupBy === "hour") {
    groupBy = "Hr";
  } else if (body.groupBy === "day") {
    groupBy = "Dy";
  } else if (body.groupBy === "month") {
    groupBy = "MM";
  } else {
    groupBy = "Yr";
  }

  const devIds = body.devices.map((d) => new ObjectID(d.deviceId));

  const findObject = {
    page: 1,
    limit: 10,
    fields: { parameters: 0 },
    filter: { _id: { $in: devIds } },
    sort: {
      _id: -1,
    },
  };

  const data = await findDevice(findObject, mongo_url, db_name);

  if (data.length < 1) {
    throw new Error("device not found");
  }

  const deviceDictionary = _.keyBy(data, "_id");

  //query to fetch timestream data based on request parameters
  const main_query = `SELECT deviceId,measure_name, ${groupBy}, MAX(measure_value::double) AS max, MIN(measure_value::double) AS min FROM "selecDev"."DevicesData" where deviceId IN (${deviceIds_string.join(
    ","
  )}) and measure_name IN (${measure_names_string.join(
    ","
  )}) and time <= '${moment(body.endDate).format(
    "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
  )}' and time >= '${moment(body.startDate).format(
    "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
  )}' ${""} GROUP BY deviceId,${groupBy}, measure_name ORDER BY ${groupBy} ${
    body.sort
  }`;

  let main_response = await readRecords(AWS, main_query, null, []);
  main_response = keyValueTransformation(main_response);
  main_response = groupByTime(main_response, deviceDictionary, groupBy);
  let responseForPastData = {};
  await Promise.all(
    body.devices.map(async (device) => {
      device["measure_name"] = device["measure_name"].map(
        (measure) => `'${measure}'`
      );
      const queryForPastData = `SELECT deviceId,measure_name,time,measure_value::double FROM "selecDev"."DevicesData" where deviceId = '${
        device.deviceId
      }' and measure_name IN (${device["measure_name"].join(
        ","
      )}) and time < '${moment(body.startDate).format(
        "yyyy-MM-DD HH:mm:ss.SSSSSSSSS"
      )}' ORDER BY time ${body.sort} LIMIT ${device["measure_name"].length}`;

      let r = await readRecords(AWS, queryForPastData, null, []);

      //transform to key value pairs
      r = keyValueTransformation(r);
      responseForPastData[device.deviceId] = r;
    })
  );

  const deviceIds = body.devices.map((d) => d.deviceId);

  main_response = main_response.map((groupData, index) => {
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
          if (index === main_response.length - 1) {
            //get max energy of data before start time to be used as min energy for oldest time group
            min = getPastMaxEnergy(
              groupData,
              responseForPastData,
              measureNameKey,
              deviceId
            );
          } else {
            min =
              _.get(main_response, `${index + 1}.${measureNameKey}-max`) * 1;
          }
          calculatedGroupData[measureNameKey] = (max - min).toFixed(2);
        }
      });
    });

    return calculatedGroupData;
  });

  return main_response;
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
            .utcOffset("+0530")
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

const getParsedValue = (value, type) => {
  let parsedValue;
  switch (type) {
    case "BOOL":
    case "FLOAT":
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
    case "UDINT_R":
      parsedValue = parseInt(value);
      break;
  }
  return parsedValue;
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

const readRecords = async (AWS, query, nextToken, arr) => {
  const queryClient = new AWS.TimestreamQuery();

  const params = {
    QueryString: query,
  };

  if (nextToken) {
    params.NextToken = `${nextToken}`;
  }
  const resp = await queryClient.query(params).promise();

  arr = [...arr, resp];

  if (resp.NextToken) {
    return await readRecords(query, resp.NextToken, arr);
  } else {
    return parseQueryResult(resp);
  }
};
const parseQueryResult = (response) => {
  const columnInfo = response.ColumnInfo;
  const rows = response.Rows;

  const data = rows.map((row) => {
    return parseRow(columnInfo, row);
  });

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

module.exports = { normalReport, energyReport };
