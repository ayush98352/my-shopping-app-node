import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as moment from 'moment';
import { MysqlConnService } from '../mysql-conn/mysql-conn.service';
import { Moment } from 'moment';
@Injectable()
export class CommonLogicService {
  moment = require('moment');
  constructor(readonly mysql_connections: MysqlConnService) { }
  getUcwords(string) {
    if (string) {
      const newString = string[0].toUpperCase() + string.slice(1);
      return newString;
    }
    return string

  }

  decryptData(encryptedMessage) {
    const crypto = require('crypto');
    const encryptionMethod = 'AES-256-CBC';
    const secret = 'sp37charjustdiallndInitbnhytrStr'; //must be 32 char length
    const iv = secret.substr(0, 16);

    const decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
    return (
      decryptor.update(encryptedMessage, 'base64', 'utf8') +
      decryptor.final('utf8')
    );
  }

  encryptData(message) {
    const crypto = require('crypto');
    const encryptionMethod = 'AES-256-CBC';
    const secret = 'sp37charjustdiallndInitbnhytrStr'; //must be 32 char length
    const iv = secret.substr(0, 16);
    const encrypter = crypto.createCipheriv(encryptionMethod, secret, iv);
    let encryptedMsg = encrypter.update(message, 'utf8', 'base64');
    encryptedMsg += encrypter.final('base64');
    return encryptedMsg;
  }

  public headers = {};
 

  

  async postCall(apiUrl, body, options = {}) {
    try {
      const response = await axios.post(apiUrl, body).then(
        (response) => {
          console.log(response);
        },
        (error) => {
          console.log(error);
        },
      );
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }



  async prepareQueryConfig() {
    const queryParams = <any>{};
    queryParams.queryType = null;
    queryParams.dbTable = null;
    queryParams.select = null;
    queryParams.where = null;
    queryParams.whereParams = <any>{};
    queryParams.orderBy = null;
    queryParams.limit = null;
    queryParams.groupBy = null;
    return queryParams;
  }

  async dbCallPdo(queryConfig, servername) {
    let result = <any>[];
    const pdoParams = {
      server: servername,
      queryDetail: queryConfig
    };
    try {
      result = this.mysql_connections.dbCallPdo(pdoParams);
    } catch (err) { }
    return result;
  }
  async dbCallPdoWIBuilder(queryParams, whereParams, server) {
    let result = <any>[];
    // console.log(queryParams)
    const pdoParams = {
      server: server,
      query: queryParams,
      params: whereParams,
    };
    try {
      result = this.mysql_connections.dbCallPdoWIBuilder(pdoParams);
    } catch (err) { }
    return result;
  }
  async dbCall(queryParams) {
    let result = <any>[];

    try {
      result = this.mysql_connections.dbCall(queryParams);
    } catch (err) { }
    return result;
  }
  calcMonths(start_date, end_date, fy) {
    const min_month = '2019-04-01';
    const output_spl = [];
    const output = [];
    const frequency = [];
    for (
      let m = moment(start_date);
      m.isSameOrBefore(end_date);
      m.add(1, 'month')
    ) {
      frequency.push({
        dueDate: moment(m).format('YYYY-MM-DD'),
      });
      const month_no = moment(m).format('MM');
      const year = moment(m).format('YYYY');
      const s_date = moment(m).startOf('month').format('YYYY-MM-DD');
      const e_date = moment(m).endOf('month').format('YYYY-MM-DD');
      output.push({
        start_date: s_date,
        end_date: e_date,
        month_no: month_no,
        year: year,
      });
      output_spl.push(month_no + year);
    }

    return { dates: output, columns: output_spl };
  }

  calcFYMonth(startDate, endDate, params) {
    const ts1 = new Date(startDate);
    const ts2 = new Date(endDate);
    let year1 = ts1.getFullYear();
    const year2 = ts2.getFullYear();
    let month_fy = [];
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const month1 = d1.getMonth();
    const month2 = d2.getMonth();

    if (month1 < 3) {
      //Upto June 2014-2015
      year1 = year1 - 1;
    }
    let diff;

    diff = (d2.getFullYear() - d1.getFullYear()) * 12;
    diff -= d1.getMonth();
    diff += d2.getMonth();
    diff = diff <= 0 ? 0 : diff; 

    let total_years = (month2 >= 3 || (month2 <= 2 && month1 <= 2)) ? Math.ceil(diff / 12) : Math.floor(diff / 12);
    let i = 0;
    let fy_start_date = year1 + '-04-01';
    let month_fy_start_date, month_fy_end_date;
    const columns = {};
    while (total_years >= 0 && new Date(fy_start_date) <= new Date(endDate)) {
      fy_start_date = month_fy_start_date = this.moment(
        year1 + '-04-01',
      ).format('YYYY-MM-DD');

      if (new Date(fy_start_date) <= new Date(endDate)) {
        month_fy_end_date = this.moment(year1 + 1 + '-03-31').format(
          'YYYY-MM-DD',
        );
        if (new Date(month_fy_end_date) > new Date(endDate)) {
          month_fy_end_date = endDate;
        }
        if (new Date(fy_start_date) < new Date(startDate)) {
          month_fy_start_date = startDate;
        }
        const return_out = this.calcMonths(
          month_fy_start_date,
          month_fy_end_date,
          fy_start_date,
        );
        //console.log(return_out)
        month_fy = month_fy.concat(return_out['dates']);
        //array_merge($month_fy,$return_out['dates']);

        columns[this.moment(fy_start_date).format('YYYY')] =
          return_out['columns'];
        year1 += 1;
        total_years--;

        i++;
      }
    }

    return { dates: month_fy, columns: columns };
  }

  sort(value: any[], key?: any, reverse?: boolean) {
    const isInside = key && key.indexOf('.') !== -1;

    key = key.split('.');

    const array: any[] = value.sort((a: any, b: any): number => {
      if (!key) {
        return a > b ? 1 : -1;
      }

      if (!isInside) {
        return a[key] > b[key] ? 1 : -1;
      }

      return this.getValue(a, key) > this.getValue(b, key) ? 1 : -1;
    });

    if (reverse) {
      return array.reverse();
    }

    return array;
  }

  getValue(object: any, key: string[]) {
    for (let i = 0, n = key.length; i < n; ++i) {
      const k = key[i];
      if (!(k in object)) {
        return;
      }

      object = object[k];
    }

    return object;
  }

  amountWithCurrencySuffix(per, value) {
    let finalValue = '';
    let possibleNegativeValue = value;
    let valueAmount = Math.abs(value);
    if (valueAmount >= 10000000) {
      finalValue = (valueAmount / 10000000).toFixed(2) + ' Cr';
    } else if (valueAmount >= 100000) {
      finalValue = (valueAmount / 100000).toFixed(2) + ' Lac';
    }
    else {
      if (valueAmount < 1) {
        finalValue = valueAmount.toFixed(2);
      } else {
        finalValue = (per >= 1) ? valueAmount.toFixed(2) : valueAmount.toFixed(0);
        finalValue = finalValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    }
    if (Math.sign(possibleNegativeValue) == -1) {
      finalValue = "-" + finalValue;
    }
    return finalValue
  }

 

}


