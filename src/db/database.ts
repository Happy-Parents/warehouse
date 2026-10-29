import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'warehouse',
  jsi: true,
  onSetUpError: (error) => {
    console.error('[db] setup failed', error);
  },
});

export const database = new Database({ adapter, modelClasses: [] });

export { schema };
