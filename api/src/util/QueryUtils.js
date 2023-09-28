import CaseUtils from './CaseUtils.js';

export default class QueryUtils {
  static getSingleByPK({ dbConnection, tableName, id }) {
    return dbConnection(tableName)
      .where(`${tableName}_id`, id)
      .then((rows) => {
        const [row] = CaseUtils.toCamelCase(rows);
        return row;
      });
  }

  static getMany() {}
}
