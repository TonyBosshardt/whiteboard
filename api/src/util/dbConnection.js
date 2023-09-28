import knex from 'knex';

const getDBConnection = () => {
  const connectionInfo = {
    host: 'localhost',
    user: 'anthony',
    password: 'Ca96642we',
    database: 'goalie',
  };

  const connection = knex({
    client: 'mysql2',
    pool: {
      min: 0,
      max: 30,
      acquireTimeoutMillis: 50000,
    },
    connection: {
      ...connectionInfo,
      debug: false,
      typeCast(field, next) {
        if (field.type === 'DATETIME') {
          const str = field.string();
          return str && new Date(`${str}Z`); // can be 'Z' for UTC or an offset in the form '+HH:MM' or '-HH:MM'
        }
        if (field.type === 'DATE') {
          // don't try and date convert dates, leave as strings
          return field.string();
        }
        if (field.type === 'NEWDECIMAL' || field.type === 'LONGLONG') {
          // if we don't convert to number they end up as strings
          const str = field.string();
          return str && +str;
        }

        return next();
      },
    },
  });

  return connection;
};

export default getDBConnection;
